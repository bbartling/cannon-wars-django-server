from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from game import views as game_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', game_views.home, name='home'),
    path('play/', game_views.play, name='play'),
]

# Serve the entire unity_build directory at /unity/ (including index.html)
urlpatterns += static('/unity/', document_root=settings.BASE_DIR / 'unity_build')
