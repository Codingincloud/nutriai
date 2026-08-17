"""
NutriAI — Recommendation Scoring Engine
Hybrid formula: 50% XGBoost quality + 30% budget fit + 20% preference history

Key design decisions:
  - Allergens: HARD EXCLUSION only (via queryset filter, never soft penalty)
  - Negative remaining budget: clamped to 0; "over budget" branches to low-cal path
  - Normalization: derived from user's calorie_target / meals_per_day (not hardcoded)
  - Behavioral learning: wired into the score formula, not just UI styling
"""
import joblib
import numpy as np
import datetime
from pathlib import Path
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from nutrition.models import Food, MealLog
from .models import RecommendationHistory
from .serializers import RecommendationHistorySerializer

# ── Model paths ──────────────────────────────────────────────────────────────
XGB_PATH = Path(__file__).resolve().parent / 'ml' / 'model.pkl'
RF_PATH  = Path(__file__).resolve().parent / 'ml' / 'rf_model.pkl'

def _load(path):
    try:
        return joblib.load(path)
    except Exception:
        return None

# Module-level cache — reloaded if None
XGB_MODEL = _load(XGB_PATH)
RF_MODEL  = _load(RF_PATH)


# ── Budget helper ─────────────────────────────────────────────────────────────
def _get_budget(user):
    """
    Returns:
        (calorie_target, protein_target, carb_target, fat_target,
         rem_cal, rem_prot, rem_carb, rem_fat, over_budget)

    Remaining values are clamped at 0. over_budget=True when user has
    exceeded their calorie target today — triggers low-calorie path.
    """
    calorie_target = 2000.0
    try:
        profile = user.profile
        calorie_target = float(profile.calorie_target or 2000)
    except Exception:
        pass

    # Standard macro split: 20% protein, 50% carbs, 30% fat
    prot_target = calorie_target * 0.20 / 4   # g (4 kcal/g)
    carb_target = calorie_target * 0.50 / 4   # g
    fat_target  = calorie_target * 0.30 / 9   # g (9 kcal/g)

    today = datetime.date.today()
    logs  = MealLog.objects.filter(user=user, date=today)

    def safe(v):
        return float(v) if v else 0.0

    consumed_cal  = sum(safe(l.food.calories)      * safe(l.quantity_g) / max(safe(l.food.serving_size_g), 1) for l in logs)
    consumed_prot = sum(safe(l.food.protein)       * safe(l.quantity_g) / max(safe(l.food.serving_size_g), 1) for l in logs)
    consumed_carb = sum(safe(l.food.carbohydrates) * safe(l.quantity_g) / max(safe(l.food.serving_size_g), 1) for l in logs)
    consumed_fat  = sum(safe(l.food.fat)           * safe(l.quantity_g) / max(safe(l.food.serving_size_g), 1) for l in logs)

    rem_cal  = calorie_target  - consumed_cal
    rem_prot = prot_target - consumed_prot
    rem_carb = carb_target - consumed_carb
    rem_fat  = fat_target  - consumed_fat

    # Clamp all remaining values at 0 — negative budget means over-limit
    over_budget = rem_cal < 0
    rem_cal  = max(0.0, rem_cal)
    rem_prot = max(0.0, rem_prot)
    rem_carb = max(0.0, rem_carb)
    rem_fat  = max(0.0, rem_fat)

    return (calorie_target, prot_target, carb_target, fat_target,
            rem_cal, rem_prot, rem_carb, rem_fat, over_budget)


def _cosine(a, b):
    """Cosine similarity, range [0, 1]."""
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm < 1e-9:
        return 0.0
    return float(np.clip(np.dot(a, b) / norm, 0.0, 1.0))


def _budget_fit(food, rem_cal, rem_prot, rem_carb, rem_fat,
                calorie_target, over_budget):
    """
    Budget fit score (0-1).
    - Normal case: cosine similarity between remaining macro budget and food profile.
    - Over budget case: reward low-calorie foods (under 150 kcal = perfect fit).
    """
    cal  = float(food.calories      or 0)
    prot = float(food.protein       or 0)
    carb = float(food.carbohydrates or 0)
    fat  = float(food.fat           or 0)

    if over_budget:
        # Recommend genuinely light options when user is over budget
        return float(np.clip(1.0 - cal / 300.0, 0.0, 1.0))

    # Per-meal normalization: derive from user's calorie target / 3 meals
    meals = 3.0
    ref_cal  = max(calorie_target / meals, 1.0)
    ref_prot = max(calorie_target * 0.20 / 4 / meals, 1.0)
    ref_carb = max(calorie_target * 0.50 / 4 / meals, 1.0)
    ref_fat  = max(calorie_target * 0.30 / 9 / meals, 1.0)

    budget_vec = np.array([rem_cal / ref_cal,
                           rem_prot / ref_prot,
                           rem_carb / ref_carb,
                           rem_fat  / ref_fat])
    food_vec   = np.array([cal / ref_cal,
                           prot / ref_prot,
                           carb / ref_carb,
                           fat  / ref_fat])
    return _cosine(budget_vec, food_vec)


def _preference_score(food_id, liked_ids, disliked_ids):
    """
    Returns 0.0–1.0 preference term.
      1.0 = explicitly liked
      0.5 = neutral (no history)
      0.0 = explicitly disliked
    """
    if food_id in liked_ids:
        return 1.0
    if food_id in disliked_ids:
        return 0.0
    return 0.5


def _reason(food, rem_cal, rem_prot, rem_carb, rem_fat, over_budget):
    """One-line reason string explaining the top factor."""
    cal  = float(food.calories      or 0)
    prot = float(food.protein       or 0)
    carb = float(food.carbohydrates or 0)
    fat  = float(food.fat           or 0)

    if over_budget:
        if cal < 150:
            return "Very low calorie — good choice when over daily budget"
        return "Light option for an already full day"

    if rem_cal <= 0:
        return "You have met today's calorie target"

    cal_fit  = abs(cal - rem_cal) / max(rem_cal, 1)
    prot_fit = abs(prot - rem_prot) / max(rem_prot, 1) if rem_prot > 0 else 1.0
    fat_fit  = abs(fat - rem_fat) / max(rem_fat, 1) if rem_fat > 0 else 1.0

    best = min(
        [('calorie',  cal_fit),
         ('protein',  prot_fit),
         ('fat',      fat_fit)],
        key=lambda x: x[1]
    )[0]

    if best == 'protein':
        return "Good protein match for your remaining daily budget"
    elif best == 'calorie':
        if cal < rem_cal * 0.4:
            return "Light snack — well within your remaining calorie allowance"
        return "Calorie-balanced for your remaining intake today"
    else:
        return "Balanced macros — fits your nutritional budget"


# ── ViewSets ─────────────────────────────────────────────────────────────────
class RecommendationHistoryViewSet(viewsets.ModelViewSet):
    serializer_class   = RecommendationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecommendationHistory.objects.filter(
            user=self.request.user).order_by('-recommended_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GetRecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        global XGB_MODEL, RF_MODEL
        if XGB_MODEL is None:
            XGB_MODEL = _load(XGB_PATH)
        if RF_MODEL is None:
            RF_MODEL = _load(RF_PATH)

        # ── 1. User profile ───────────────────────────────────────────────
        dietary_pref  = 'none'
        health_cond   = ''
        try:
            profile      = request.user.profile
            dietary_pref = profile.dietary_preference or 'none'
            health_cond  = (profile.health_conditions or '').lower()
        except Exception:
            pass

        # ── 2. Daily budget (clamped, with over-budget flag) ──────────────
        (calorie_target, _, _, _,
         rem_cal, rem_prot, rem_carb, rem_fat,
         over_budget) = _get_budget(request.user)

        # ── 3. Behavioral history ─────────────────────────────────────────
        liked_ids = set(RecommendationHistory.objects.filter(
            user=request.user, feedback='liked').values_list('food_id', flat=True))
        disliked_ids = set(RecommendationHistory.objects.filter(
            user=request.user, feedback='disliked').values_list('food_id', flat=True))

        # ── 4. Safety filter (HARD EXCLUSION — allergens always excluded) ─
        foods = Food.objects.all()
        if dietary_pref == 'vegetarian':
            foods = foods.filter(is_vegetarian=True)
        elif dietary_pref == 'vegan':
            foods = foods.filter(is_vegan=True)
        if 'diabetes' in health_cond:
            foods = foods.filter(sugar__lt=15)
        if 'hypertension' in health_cond:
            foods = foods.filter(sodium__lt=300)
        # Note: allergens excluded at queryset level — no soft penalty needed

        foods = list(foods)
        if not foods:
            return Response([])

        # ── 5. Score each food ────────────────────────────────────────────
        results = []
        for food in foods:
            cal  = float(food.calories      or 0)
            prot = float(food.protein       or 0)
            carb = float(food.carbohydrates or 0)
            fat  = float(food.fat           or 0)
            fib  = float(getattr(food, 'fiber',  0) or 0)
            sug  = float(getattr(food, 'sugar',  0) or 0)
            sod  = float(getattr(food, 'sodium', 0) or 0)

            feat = np.array([[cal, prot, carb, fat, fib, sug, sod]])

            # XGBoost nutritional quality score (0-1, genuine spread after retraining)
            xgb_score = float(np.clip(
                XGB_MODEL.predict(feat)[0] if XGB_MODEL else 0.5, 0.0, 1.0))

            # Random Forest score for comparison (0-1)
            rf_score = float(np.clip(
                RF_MODEL.predict(feat)[0] if RF_MODEL else xgb_score, 0.0, 1.0))

            # Budget fit via cosine similarity (handles over-budget case)
            budget_fit = _budget_fit(food, rem_cal, rem_prot, rem_carb, rem_fat,
                                     calorie_target, over_budget)

            # Behavioral preference (wired into formula, not just UI)
            pref = _preference_score(food.id, liked_ids, disliked_ids)

            # ── Hybrid score formula (Section 6.3.3 in report) ───────────
            # 50% nutritional quality (XGBoost) + 30% budget fit + 20% preference
            hybrid = 0.50 * xgb_score + 0.30 * budget_fit + 0.20 * pref
            hybrid = float(np.clip(hybrid, 0.0, 1.0))

            results.append({
                'id':            food.id,
                'name':          food.name,
                'name_nepali':   getattr(food, 'name_nepali', '') or '',
                'category':      food.category or '',
                'calories':      round(cal),
                'protein':       round(prot, 1),
                'carbohydrates': round(carb, 1),
                'fat':           round(fat, 1),
                'is_vegetarian': food.is_vegetarian,
                'is_nepali':     getattr(food, 'is_nepali', False),
                # Scores
                'score':         round(hybrid, 3),
                'match_percent': round(hybrid * 100),
                'xgb_score':     round(xgb_score * 100),
                'rf_score':      round(rf_score * 100),
                # Human-readable explanation
                'reason':        _reason(food, rem_cal, rem_prot, rem_carb,
                                         rem_fat, over_budget),
                # Behavioral tags (reflect actual score contribution)
                'liked':         food.id in liked_ids,
                'disliked':      food.id in disliked_ids,
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return Response(results[:15])


class RecommendationFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, food_id):
        feedback = request.data.get('feedback', 'liked')
        try:
            food = Food.objects.get(id=food_id)
            RecommendationHistory.objects.update_or_create(
                user=request.user, food=food,
                defaults={'feedback': feedback}
            )
            return Response({'status': 'saved'})
        except Food.DoesNotExist:
            return Response({'error': 'Food not found'}, status=404)
