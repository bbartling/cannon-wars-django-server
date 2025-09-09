from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .models import Comment
from .forms import CommentForm


@login_required
def add_comment(request, game_slug):
    """Add a comment to the given game slug. Requires login."""
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            body = form.cleaned_data['body']
            Comment.objects.create(game_slug=game_slug, user=request.user, body=body)
            messages.success(request, 'Comment posted!')
        else:
            messages.error(request, 'There was an error with your comment.')
    return redirect(request.META.get('HTTP_REFERER', '/'))