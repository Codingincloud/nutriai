import google.generativeai as genai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import ChatMessage
import datetime

class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        message = request.data.get('message', request.data.get('content', ''))
        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Build user context
        user_context = ''
        try:
            profile = request.user.profile
            user_context = f"""
User Profile:
- Name: {request.user.username}
- Age: {profile.age}, Gender: {profile.gender}
- Height: {profile.height_cm}cm, Weight: {profile.weight_kg}kg
- BMI: {profile.bmi:.1f if profile.bmi else 'Unknown'}
- Health Goal: {profile.health_goal}
- Daily Calorie Target: {profile.calorie_target:.0f if profile.calorie_target else 'Unknown'} kcal
- Dietary Preference: {profile.dietary_preference}
- Allergies: {profile.allergies or 'None'}
- Health Conditions: {profile.health_conditions or 'None'}
"""
        except Exception:
            user_context = f'User: {request.user.username}'
        
        system_prompt = f"""You are NutriAI, a personalized nutrition assistant specializing in Nepali cuisine and dietary patterns. You have access to NepaliNutriDB, a database of 117+ traditional Nepali foods (Dal Bhat, Momo, Dhido, Gundruk, Sel Roti, Sekuwa, etc.).

{user_context}

Provide helpful, personalized, and safe nutrition advice. When relevant, suggest Nepali foods that fit the user's goals. Keep responses concise (2-4 paragraphs max) and practical. Always consider the user's health conditions and allergies."""
        
        try:
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(system_prompt + '\n\nUser: ' + message)
                reply = response.text
            else:
                reply = f'Hello {request.user.username}! I am NutriAI assistant. To enable AI responses, please configure the GEMINI_API_KEY. For now: based on your goal, focus on balanced meals with proper protein intake.'
        except Exception as e:
            reply = f'Sorry, I encountered an error connecting to the AI. Please try again. Error: {str(e)}'
        
        # Save to DB
        try:
            ChatMessage.objects.create(
                user=request.user,
                role='user',
                content=message
            )
            ChatMessage.objects.create(
                user=request.user,
                role='assistant', 
                content=reply
            )
        except Exception:
            pass
        
        return Response({'reply': reply, 'content': reply, 'timestamp': str(datetime.datetime.now())})
    
    def get(self, request):
        try:
            messages = ChatMessage.objects.filter(user=request.user).order_by('created_at')[:50]
            data = [{'role': m.role, 'content': m.content, 'timestamp': str(m.created_at)} for m in messages]
            return Response(data)
        except Exception:
            return Response([])
