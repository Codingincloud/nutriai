from nutrition.models import Food
from recommendations.models import RecommendationHistory
from users.models import UserProfile
import random

def get_recommendations(user, limit=5, meal_type='lunch'):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    
    # Base filter based on user profile
    foods = Food.objects.all()
    
    if profile.dietary_preference == 'vegetarian':
        foods = foods.filter(is_vegetarian=True)
    elif profile.dietary_preference == 'vegan':
        foods = foods.filter(is_vegan=True)
    elif profile.dietary_preference == 'gluten_free':
        foods = foods.filter(is_gluten_free=True)
        
    # Safety filters
    allergies = [a.strip().lower() for a in profile.allergies.split(',')] if profile.allergies else []
    if 'nut' in allergies or 'nuts' in allergies or 'peanut' in allergies:
        foods = foods.filter(contains_nuts=False)
    if 'dairy' in allergies or 'milk' in allergies:
        foods = foods.filter(contains_dairy=False)
    if 'gluten' in allergies or 'wheat' in allergies:
        foods = foods.filter(contains_gluten=False)
    if 'egg' in allergies or 'eggs' in allergies:
        foods = foods.filter(contains_egg=False)
        
    # TODO: In future, integrate XGBoost model here.
    # Currently fallback to random scoring with behavioral adjustment
    
    scored_foods = []
    
    # Behavioral learning adjustment
    past_recs = RecommendationHistory.objects.filter(user=user)
    food_scores_adj = {}
    for rec in past_recs:
        if rec.is_eaten:
            food_scores_adj[rec.food_id] = food_scores_adj.get(rec.food_id, 0) + 1.0
        if rec.user_rating:
            food_scores_adj[rec.food_id] = food_scores_adj.get(rec.food_id, 0) + (rec.user_rating - 3) * 0.5
            
    for f in foods:
        base_score = random.uniform(0.5, 0.9)
        base_score += food_scores_adj.get(f.id, 0.0)
        scored_foods.append((f, base_score))
        
    scored_foods.sort(key=lambda x: x[1], reverse=True)
    top_foods = scored_foods[:limit]
    
    results = []
    for food, score in top_foods:
        # Save to history
        RecommendationHistory.objects.create(
            user=user,
            food=food,
            score=score
        )
        results.append({
            'food_id': food.id,
            'name': food.name,
            'name_nepali': food.name_nepali,
            'category': food.category,
            'calories': food.calories,
            'score': round(score, 3)
        })
        
    return results
