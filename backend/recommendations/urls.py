from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecommendationHistoryViewSet, GetRecommendationsView, RecommendationFeedbackView

router = DefaultRouter()
router.register(r'history', RecommendationHistoryViewSet, basename='recommendation-history')

urlpatterns = [
    path('', include(router.urls)),
    path('generate/', GetRecommendationsView.as_view(), name='generate-recommendations'),
    path('<int:food_id>/feedback/', RecommendationFeedbackView.as_view(), name='recommendation-feedback'),
]
