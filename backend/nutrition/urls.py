from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodViewSet, MealLogViewSet, DailySummaryView, WeeklySummaryView

router = DefaultRouter()
router.register(r'foods', FoodViewSet)
router.register(r'logs', MealLogViewSet, basename='meallog')

urlpatterns = [
    path('daily-summary/', DailySummaryView.as_view(), name='daily-summary'),
    path('weekly-summary/', WeeklySummaryView.as_view(), name='weekly-summary'),
    path('', include(router.urls)),
]
