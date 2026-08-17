from django.db import models
from django.contrib.auth.models import User
from nutrition.models import Food

class RecommendationHistory(models.Model):
    FEEDBACK_CHOICES = [
        ('liked',    'Liked'),
        ('disliked', 'Disliked'),
        ('neutral',  'Neutral'),
    ]

    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    food           = models.ForeignKey(Food, on_delete=models.CASCADE)
    recommended_at = models.DateTimeField(auto_now_add=True)
    score          = models.FloatField(default=0.0)
    user_rating    = models.IntegerField(null=True, blank=True)   # 1-5 scale (legacy)
    is_eaten       = models.BooleanField(default=False)
    feedback       = models.CharField(
        max_length=10,
        choices=FEEDBACK_CHOICES,
        null=True,
        blank=True,
        db_index=True
    )

    class Meta:
        # A user can rate the same food multiple times (different recommendation sessions)
        ordering = ['-recommended_at']

    def __str__(self):
        return f"{self.user.username} - {self.food.name} ({self.feedback or 'no feedback'})"
