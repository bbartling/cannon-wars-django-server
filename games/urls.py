from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("g/<slug:slug>/", views.game_detail, name="game_detail"),

    # studio
    path("studio/",                    views.studio_dashboard, name="studio_dashboard"),
    path("studio/new/",                views.game_create,      name="game_create"),
    path("studio/<slug:slug>/edit/",   views.game_edit,        name="game_edit"),
    path("studio/<slug:slug>/delete/", views.game_delete,      name="game_delete"),  # deletion

]
