# game/views.py
from pathlib import Path
from django.conf import settings
from django.shortcuts import render, redirect

def home(request):
    return render(request, "game/home.html")

def play(request):
    idx = Path(settings.UNITY_BUILD_DIR) / "index.html"
    if idx.exists():
        return redirect("/unity/index.html")
    return render(request, "game/no_unity.html", {"expected_path": str(idx)})
