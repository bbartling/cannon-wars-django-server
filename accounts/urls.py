from django.urls import path
from . import views


app_name = 'accounts'

urlpatterns = [
    path('request-magic/', views.request_magic, name='request_magic'),
    path('verify/<str:token>/', views.verify, name='verify'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]