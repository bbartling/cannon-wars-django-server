# diy_django/urls.py
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from game import views as game_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", game_views.home, name="home"),
    path("play/", game_views.play, name="play"),
]

# Serve Unity export at /unity/
urlpatterns += static("/unity/", document_root=settings.UNITY_BUILD_DIR)
