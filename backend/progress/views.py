from rest_framework import viewsets, permissions, views
from rest_framework.response import Response
from .models import WeightRecord
from .serializers import WeightRecordSerializer
from .ml.predictor import predict_weight_trend

class WeightRecordViewSet(viewsets.ModelViewSet):
    serializer_class = WeightRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WeightRecord.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WeightPredictionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        records = list(WeightRecord.objects.filter(user=request.user).order_by('date'))
        calorie_target = 2000
        try:
            calorie_target = request.user.profile.calorie_target or 2000
        except:
            pass
        
        result = predict_weight_trend(records, calorie_target, weeks=8)
        
        # Add goal weight
        try:
            result['goal_weight'] = request.user.profile.goal_weight_kg
        except:
            result['goal_weight'] = None
        
        return Response(result)
