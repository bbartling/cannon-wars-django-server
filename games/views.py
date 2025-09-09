from django.shortcuts import render
from comments.models import Comment


def home(request):
    """Home page listing available games."""
    return render(request, 'games/home.html')


def pop_the_lock(request):
    """Pop the Lock game page."""
    slug = 'pop-the-lock'
    comments = Comment.objects.filter(game_slug=slug, is_approved=True)
    context = {
        'slug': slug,
        'comments': comments,
        'range15': range(1, 16),
    }
    return render(request, 'games/pop_the_lock.html', context)


def fly_swatter(request):
    """Fly Swatter game page."""
    slug = 'fly-swatter'
    comments = Comment.objects.filter(game_slug=slug, is_approved=True)
    context = {
        'slug': slug,
        'comments': comments,
    }
    return render(request, 'games/fly_swatter.html', context)


def tutorial_pop_the_lock(request):
    slug = 'pop-the-lock'
    return render(request, 'games/tutorial_pop_the_lock.html', {'slug': slug})


def tutorial_fly_swatter(request):
    slug = 'fly-swatter'
    return render(request, 'games/tutorial_fly_swatter.html', {'slug': slug})


def leaderboard_pop_the_lock(request):
    slug = 'pop-the-lock'
    return render(request, 'games/leaderboard_pop_the_lock.html', {'slug': slug})


def leaderboard_fly_swatter(request):
    slug = 'fly-swatter'
    return render(request, 'games/leaderboard_fly_swatter.html', {'slug': slug})