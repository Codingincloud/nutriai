from django.contrib import admin
from .models import RecommendationHistory

@admin.register(RecommendationHistory)
class RecommendationHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'food', 'score', 'user_rating', 'is_eaten', 'recommended_at')
