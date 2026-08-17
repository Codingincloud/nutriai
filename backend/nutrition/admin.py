from django.contrib import admin
from .models import Food, MealLog

@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_nepali', 'category', 'calories', 'is_nepali')
    search_fields = ('name', 'name_nepali')
    list_filter = ('category', 'is_nepali', 'is_vegetarian')

@admin.register(MealLog)
class MealLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'food', 'quantity_g', 'meal_type', 'date')
    list_filter = ('date', 'meal_type')
