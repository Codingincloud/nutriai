from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/nutrition/', include('nutrition.urls')),
    path('api/recommendations/', include('recommendations.urls')),
    path('api/assistant/', include('assistant.urls')),
    path('api/progress/', include('progress.urls')),
]
