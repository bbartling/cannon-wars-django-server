# game/views.py
from pathlib import Path
from django.conf import settings
from django.http import Http404
from django.shortcuts import render, redirect

# --- Tutorial: where the .cs files live (bundle them with the app) ---
APP_DIR = Path(__file__).resolve().parent
CODE_DIR = APP_DIR / "code"   # create: game/code/EnemyCannonAI.cs, etc.

FILES = {
    "EnemyCannonAI": {
        "title": "EnemyCannonAI.cs",
        "path": CODE_DIR / "EnemyCannonAI.cs",
    },
    "CannonManager": {
        "title": "CannonManager.cs",
        "path": CODE_DIR / "CannonManager.cs",
    },
    "ProjectileCameraController": {
        "title": "ProjectileCameraController.cs",
        "path": CODE_DIR / "ProjectileCameraController.cs",
    },
}

def home(request):
    return render(request, "game/home.html")

def play(request):
    idx = Path(settings.UNITY_BUILD_DIR) / "index.html"
    if idx.exists():
        # /unity/* is served by urls.py static() rule below
        return redirect("/unity/index.html")
    return render(request, "game/no_unity.html", {"expected_path": str(idx)})

# ---------- Simple tutorial: one C# file at a time ----------
def tutorial(request, slug="EnemyCannonAI"):
    info = FILES.get(slug)
    if not info:
        raise Http404("Unknown file")

    try:
        code = info["path"].read_text(encoding="utf-8", errors="replace")

    except FileNotFoundError:
        code = f"// File not found. Expected at: {info['path']}"

    return render(
        request,
        "game/tutorial.html",
        {"slug": slug, "title": info["title"], "code": code},
    )
