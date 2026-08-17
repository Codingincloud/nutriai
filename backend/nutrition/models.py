from django.db import models
from django.contrib.auth.models import User
import datetime

class Food(models.Model):
    CATEGORY_CHOICES = [
        ('nepali_staple', 'Nepali Staple'),
        ('nepali_snack', 'Nepali Snack'),
        ('nepali_bread', 'Nepali Bread'),
        ('nepali_curry', 'Nepali Curry'),
        ('nepali_vegetable', 'Nepali Vegetable'),
        ('nepali_meat', 'Nepali Meat'),
        ('nepali_sweet', 'Nepali Sweet'),
        ('nepali_beverage', 'Nepali Beverage'),
        ('nepali_pickle', 'Nepali Pickle'),
        ('grain', 'Grain'),
        ('vegetable', 'Vegetable'),
        ('fruit', 'Fruit'),
        ('dairy', 'Dairy'),
        ('protein', 'Protein'),
        ('fat_oil', 'Fat/Oil'),
        ('beverage', 'Beverage'),
        ('snack', 'Snack'),
        ('international', 'International'),
    ]

    name = models.CharField(max_length=255, unique=True)
    name_nepali = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    
    calories = models.FloatField()
    protein = models.FloatField()
    carbohydrates = models.FloatField()
    fat = models.FloatField()
    fiber = models.FloatField(default=0)
    sugar = models.FloatField(default=0)
    sodium = models.FloatField(default=0)
    
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    
    contains_nuts = models.BooleanField(default=False)
    contains_dairy = models.BooleanField(default=False)
    contains_gluten = models.BooleanField(default=False)
    contains_egg = models.BooleanField(default=False)
    
    is_nepali = models.BooleanField(default=False)
    data_source = models.CharField(max_length=255, blank=True)
    serving_size_g = models.FloatField(default=100)

    def __str__(self):
        return self.name

class MealLog(models.Model):
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('snack', 'Snack'),
        ('dinner', 'Dinner'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_logs')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    quantity_g = models.FloatField()
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    logged_at = models.DateTimeField(auto_now_add=True)
    # Changed from auto_now_add to allow date filtering for past/future days
    date = models.DateField(default=datetime.date.today)

    def __str__(self):
        return f"{self.user.username} - {self.food.name} ({self.date})"
