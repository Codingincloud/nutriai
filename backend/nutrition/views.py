from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Food, MealLog
from .serializers import FoodSerializer, MealLogSerializer
import datetime


class FoodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_nepali', 'is_vegetarian', 'is_vegan', 'is_gluten_free']
    search_fields = ['name', 'name_nepali']


class MealLogViewSet(viewsets.ModelViewSet):
    serializer_class = MealLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['date', 'meal_type']

    def get_queryset(self):
        return MealLog.objects.filter(user=self.request.user).order_by('-logged_at')

    def perform_create(self, serializer):
        # Allow client to supply a date; fall back to today
        date_str = self.request.data.get('date', None)
        if date_str:
            try:
                date = datetime.date.fromisoformat(date_str)
            except ValueError:
                date = datetime.date.today()
        else:
            date = datetime.date.today()
        serializer.save(user=self.request.user, date=date)


def _safe_nutrient(food_val, quantity_g, serving_size_g):
    """Compute nutrient amount, guarding against zero serving size."""
    s = serving_size_g if serving_size_g and serving_size_g > 0 else 100
    return (food_val or 0) * quantity_g / s


class DailySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date', str(datetime.date.today()))
        try:
            date = datetime.date.fromisoformat(date_str)
        except ValueError:
            date = datetime.date.today()

        logs = MealLog.objects.filter(user=request.user, date=date).select_related('food')

        total_calories = sum(_safe_nutrient(log.food.calories, log.quantity_g, log.food.serving_size_g) for log in logs)
        total_protein  = sum(_safe_nutrient(log.food.protein,  log.quantity_g, log.food.serving_size_g) for log in logs)
        total_carbs    = sum(_safe_nutrient(log.food.carbohydrates, log.quantity_g, log.food.serving_size_g) for log in logs)
        total_fat      = sum(_safe_nutrient(log.food.fat,      log.quantity_g, log.food.serving_size_g) for log in logs)

        calorie_target = 2000
        try:
            calorie_target = request.user.profile.calorie_target or 2000
        except Exception:
            pass

        return Response({
            'date': str(date),
            'total_calories': round(total_calories, 1),
            'total_protein': round(total_protein, 1),
            'total_carbs': round(total_carbs, 1),
            'total_fat': round(total_fat, 1),
            'calorie_target': calorie_target,
            'calories_remaining': round(max(0, calorie_target - total_calories), 1),
            'meal_count': logs.count(),
        })


class WeeklySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = datetime.date.today()
        result = []

        calorie_target = 2000
        try:
            calorie_target = request.user.profile.calorie_target or 2000
        except Exception:
            pass

        for i in range(6, -1, -1):
            date = today - datetime.timedelta(days=i)
            logs = MealLog.objects.filter(user=request.user, date=date).select_related('food')
            total_calories = sum(_safe_nutrient(log.food.calories, log.quantity_g, log.food.serving_size_g) for log in logs)
            result.append({
                'date': str(date),
                'day': date.strftime('%a'),
                'calories': round(total_calories, 1),
                'target': calorie_target,
            })

        return Response(result)
