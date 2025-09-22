from django.conf import settings
from django.shortcuts import render, redirect

def home(request):
    return render(request, 'game/home.html')

def play(request):
    index_file = settings.BASE_DIR / 'unity_build' / 'index.html'
    if index_file.exists():
        return redirect('/unity/index.html')
    return render(request, 'game/no_unity.html', {'expected_path': str(index_file)})
