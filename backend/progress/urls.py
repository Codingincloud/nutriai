from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeightRecordViewSet, WeightPredictionView

router = DefaultRouter()
router.register(r'weight', WeightRecordViewSet, basename='weight-record')

urlpatterns = [
    path('', include(router.urls)),
    path('predict/', WeightPredictionView.as_view(), name='predict-weight'),
]
