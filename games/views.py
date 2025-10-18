# games/views.py
import os
from django.conf import settings
from django.contrib import messages
from django.http import Http404
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.utils import OperationalError, ProgrammingError

from .models import Game
from .forms import GameForm
from .utils import process_unity_webgl_zip

def _is_staff(user): 
    return user.is_staff

# ----- PUBLIC -----
def home(request):
    # staff lands in Studio automatically
    if request.user.is_authenticated and request.user.is_staff:
        return redirect("studio_dashboard")
    try:
        games = list(Game.objects.filter(published=True).order_by("order", "title"))
    except (OperationalError, ProgrammingError):
        games = []
    return render(request, "home.html", {"games": games})

def game_detail(request, slug):
    game = Game.objects.filter(slug=slug, published=True).first()
    if game:
        return render(request, "detail.html", {"game": game})
    # friendly blank instead of 404
    return render(request, "detail_blank.html", {
        "game": {"title": slug.replace("-", " ").title(), "short_desc": "", "slug": slug, "tag_list": []}
    })

# Deprecated direct download endpoints (kept for backwards compat; always 404)
def download_windows(request, slug):  # pragma: no cover
    raise Http404("Direct downloads have been disabled in this version.")

def download_mac(request, slug):  # pragma: no cover
    raise Http404("Direct downloads have been disabled in this version.")

# ----- STUDIO -----
@login_required
@user_passes_test(_is_staff)
def studio_dashboard(request):
    try:
        games = Game.objects.all().order_by("order", "title")
        db_ready = True
    except (OperationalError, ProgrammingError):
        games, db_ready = [], False
    return render(request, "studio/dashboard.html", {"games": games, "db_ready": db_ready})

@login_required
@user_passes_test(_is_staff)
def game_create(request):
    try:
        if request.method == "POST":
            form = GameForm(request.POST, request.FILES)
            if form.is_valid():
                game = form.save(commit=False)

                # If a WebGL zip was uploaded, extract and set Play URL
                uploaded = form.cleaned_data.get("web_zip")
                if uploaded:
                    try:
                        media_play_url = process_unity_webgl_zip(slug=game.slug, django_file=uploaded)
                        # store a relative media URL; you can switch to absolute if you prefer
                        game.external_download_url = media_play_url
                        messages.success(request, "WebGL build uploaded and extracted.")
                    except Exception as e:
                        messages.error(request, f"Failed to extract WebGL zip: {e}")

                game.save()
                return redirect("studio_dashboard")
        else:
            form = GameForm(initial={
                "title": "Physics Playground",
                "slug": "physics-playground",
                "short_desc": "Explore gravity, collisions and other forces in this simulation.",
                "tags": "Physics, Simulation, Experiment",
                "published": True,
                "order": 0,
            })
        return render(request, "studio/edit.html", {"form": form, "mode": "create"})
    except (OperationalError, ProgrammingError):
        return render(request, "studio/db_not_ready.html")

@login_required
@user_passes_test(_is_staff)
def game_edit(request, slug):
    try:
        game = Game.objects.filter(slug=slug).first()
        if not game:
            return redirect(f"/studio/new/?slug={slug}")

        if request.method == "POST":
            form = GameForm(request.POST, request.FILES, instance=game)
            if form.is_valid():
                game = form.save(commit=False)

                uploaded = form.cleaned_data.get("web_zip")
                if uploaded:
                    try:
                        media_play_url = process_unity_webgl_zip(slug=game.slug, django_file=uploaded)
                        game.external_download_url = media_play_url
                        messages.success(request, "WebGL build uploaded and extracted.")
                    except Exception as e:
                        messages.error(request, f"Failed to extract WebGL zip: {e}")

                game.save()
                return redirect("studio_dashboard")
        else:
            form = GameForm(instance=game)

        return render(request, "studio/edit.html", {"form": form, "mode": "edit", "game": game})
    except (OperationalError, ProgrammingError):
        return render(request, "studio/db_not_ready.html")

@login_required
@user_passes_test(_is_staff)
def game_delete(request, slug):
    game = get_object_or_404(Game, slug=slug)
    if request.method == "POST":
        game.delete()
        return redirect("studio_dashboard")
    return render(request, "studio/confirm_delete.html", {"game": game})

def game_download_redirect(request, slug):  # pragma: no cover
    game = get_object_or_404(Game, slug=slug)
    url = getattr(game, "external_download_url", "")
    if url:
        return redirect(url)
    raise Http404("No play URL has been configured for this game.")
