from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.utils import timezone
from django.urls import reverse
from django.conf import settings
from django.core.mail import send_mail

from .forms import EmailForm, SetCredentialsForm, LoginForm
from .models import EmailToken

User = get_user_model()


def request_magic(request):
    """Display a form to enter an email and send a verification link."""
    if request.method == 'POST':
        form = EmailForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            token = EmailToken.generate(email=email, purpose='verify', minutes_valid=60)
            token.save()
            verify_url = request.build_absolute_uri(reverse('accounts:verify', args=[token.token]))
            subject = 'Confirm your email'
            html_body = f'<p>Click the link below to confirm your email and create your account:</p><p><a href="{verify_url}">{verify_url}</a></p>'
            text_body = f'Visit this link to confirm your email: {verify_url}'
            # Send the email. In development this will print to console.
            send_mail(
                subject=subject,
                message=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL or None,
                recipient_list=[email],
                html_message=html_body,
            )
            messages.info(request, 'Check your email for a confirmation link.')
            return redirect('accounts:request_magic')
    else:
        form = EmailForm()
    return render(request, 'accounts/request_magic.html', {'form': form})


def verify(request, token):
    """Verify a user's email token and allow them to set username and password."""
    tok = get_object_or_404(EmailToken, token=token, purpose='verify')
    if tok.is_expired():
        messages.error(request, 'Your confirmation link has expired.')
        tok.delete()
        return redirect('accounts:request_magic')

    if request.method == 'POST':
        form = SetCredentialsForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user, created = User.objects.get_or_create(email=tok.email, defaults={'username': username})
            # If the user existed but had no username, set it now
            if not created and not user.username:
                user.username = username
            user.set_password(password)
            user.is_active = True
            user.save()
            tok.delete()
            messages.success(request, 'Account created! Please log in.')
            return redirect('accounts:login')
    else:
        form = SetCredentialsForm()
    return render(request, 'accounts/verify.html', {'form': form, 'email': tok.email})


def login_view(request):
    """Authenticate and log in a user."""
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, 'Logged in!')
                next_url = request.GET.get('next') or 'games:home'
                return redirect(next_url)
            messages.error(request, 'Invalid credentials.')
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    """Log out the current user."""
    logout(request)
    messages.info(request, 'Logged out.')
    return redirect('games:home')