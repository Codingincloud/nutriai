from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    ACTIVITY_CHOICES = [
        ('sedentary', 'Sedentary'),
        ('lightly_active', 'Lightly Active'),
        ('moderately_active', 'Moderately Active'),
        ('very_active', 'Very Active'),
        ('extra_active', 'Extra Active'),
    ]
    
    GOAL_CHOICES = [
        ('lose_weight', 'Lose Weight'),
        ('maintain_weight', 'Maintain Weight'),
        ('gain_weight', 'Gain Weight'),
        ('build_muscle', 'Build Muscle'),
    ]

    DIET_PREF_CHOICES = [
        ('none', 'None'),
        ('vegetarian', 'Vegetarian'),
        ('vegan', 'Vegan'),
        ('non_vegetarian', 'Non-Vegetarian'),
        ('eggetarian', 'Eggetarian'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    goal_weight_kg = models.FloatField(null=True, blank=True)
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_CHOICES, default='sedentary')
    health_goal = models.CharField(max_length=20, choices=GOAL_CHOICES, default='maintain_weight')
    dietary_preference = models.CharField(max_length=20, choices=DIET_PREF_CHOICES, default='none')
    
    allergies = models.TextField(blank=True, help_text="Comma-separated allergies, e.g. nuts,dairy,gluten")
    health_conditions = models.TextField(blank=True, help_text="Comma-separated conditions, e.g. diabetes,hypertension")
    
    # Calculated fields — updated on save
    bmi = models.FloatField(null=True, blank=True)
    bmr = models.FloatField(null=True, blank=True)
    tdee = models.FloatField(null=True, blank=True)
    calorie_target = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_metrics(self):
        """Calculate BMI, BMR (Mifflin-St Jeor), TDEE, and calorie target."""
        if not all([self.weight_kg, self.height_cm, self.age, self.gender]):
            return None
            
        height_m = self.height_cm / 100.0
        self.bmi = round(self.weight_kg / (height_m ** 2), 2)
        
        # Mifflin-St Jeor BMR
        if self.gender == 'male':
            self.bmr = round((10 * self.weight_kg) + (6.25 * self.height_cm) - (5 * self.age) + 5, 2)
        elif self.gender == 'female':
            self.bmr = round((10 * self.weight_kg) + (6.25 * self.height_cm) - (5 * self.age) - 161, 2)
        else:
            self.bmr = round((10 * self.weight_kg) + (6.25 * self.height_cm) - (5 * self.age) - 78, 2)
            
        activity_multipliers = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
            'extra_active': 1.9,
        }
        
        self.tdee = round(self.bmr * activity_multipliers.get(self.activity_level, 1.2), 2)
        
        # Calorie target based on health goal
        if self.health_goal == 'lose_weight':
            self.calorie_target = round(self.tdee - 500, 2)
        elif self.health_goal in ('gain_weight', 'build_muscle'):
            self.calorie_target = round(self.tdee + 500, 2)
        else:
            self.calorie_target = self.tdee
            
        return {
            'bmi': self.bmi,
            'bmr': self.bmr,
            'tdee': self.tdee,
            'calorie_target': self.calorie_target,
        }

    def save(self, *args, **kwargs):
        self.calculate_metrics()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s Profile"

