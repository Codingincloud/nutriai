from django.contrib import admin
from .models import WeightRecord

@admin.register(WeightRecord)
class WeightRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'weight_kg', 'date', 'created_at')
    list_filter = ('date',)
