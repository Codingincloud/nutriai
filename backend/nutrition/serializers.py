from rest_framework import serializers
from .models import Food, MealLog

class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'

class MealLogSerializer(serializers.ModelSerializer):
    food_details = FoodSerializer(source='food', read_only=True)
    total_calories = serializers.SerializerMethodField()
    total_protein  = serializers.SerializerMethodField()
    total_carbs    = serializers.SerializerMethodField()
    total_fat      = serializers.SerializerMethodField()

    class Meta:
        model  = MealLog
        fields = '__all__'
        read_only_fields = ('user', 'logged_at', 'date')

    def validate_quantity_g(self, value):
        if value <= 0:
            raise serializers.ValidationError('Portion size must be greater than 0g.')
        if value > 5000:
            raise serializers.ValidationError('Portion size cannot exceed 5000g.')
        return value

    def _multiplier(self, obj):
        return obj.quantity_g / max(obj.food.serving_size_g, 1)

    def get_total_calories(self, obj):
        return round(obj.food.calories * self._multiplier(obj), 2)

    def get_total_protein(self, obj):
        return round(obj.food.protein * self._multiplier(obj), 2)

    def get_total_carbs(self, obj):
        return round(obj.food.carbohydrates * self._multiplier(obj), 2)

    def get_total_fat(self, obj):
        return round(obj.food.fat * self._multiplier(obj), 2)
