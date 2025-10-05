# game/urls.py
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from game import views as game_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Home + Play
    path('', game_views.home, name='home'),
    path('play/', game_views.play, name='play'),

    # Tutorial (default to EnemyCannonAI)
    path('tutorial/', game_views.tutorial, name='tutorial_default'),
    path('tutorial/<slug:slug>/', game_views.tutorial, name='tutorial'),
]

# Serve /unity/* from the Unity WebGL export directory (e.g., build folder)
urlpatterns += static('/unity/', document_root=settings.UNITY_BUILD_DIR)
