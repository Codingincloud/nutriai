from rest_framework import serializers
from .models import RecommendationHistory
from nutrition.serializers import FoodSerializer

class RecommendationHistorySerializer(serializers.ModelSerializer):
    food_details = FoodSerializer(source='food', read_only=True)

    class Meta:
        model = RecommendationHistory
        fields = '__all__'
        read_only_fields = ('user', 'recommended_at', 'score')
