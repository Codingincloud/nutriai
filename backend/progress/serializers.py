from rest_framework import serializers
from .models import WeightRecord

class WeightRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightRecord
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
