from django.urls import path
from django.views.generic import RedirectView
from . import views

app_name = 'games'

urlpatterns = [
    path('', views.home, name='home'),
    path('games/pop-the-lock/', views.pop_the_lock, name='pop_the_lock'),
    path('games/fly-swatter/', views.fly_swatter, name='fly_swatter'),
    path('games/tutorial/pop-the-lock/', views.tutorial_pop_the_lock, name='tutorial_pop_the_lock'),
    path('games/tutorial/fly-swatter/', views.tutorial_fly_swatter, name='tutorial_fly_swatter'),
    path('games/leaderboard/pop-the-lock/', views.leaderboard_pop_the_lock, name='leaderboard_pop_the_lock'),
    path('games/leaderboard/fly-swatter/', views.leaderboard_fly_swatter, name='leaderboard_fly_swatter'),

    # Aliases (optional)
    path('pop_the_lock_leaderboard', RedirectView.as_view(pattern_name='games:leaderboard_pop_the_lock', permanent=False)),
    path('fly_swatter_leaderboard', RedirectView.as_view(pattern_name='games:leaderboard_fly_swatter', permanent=False)),
]
