from django import forms
from django.contrib.auth import get_user_model


User = get_user_model()


class EmailForm(forms.Form):
    email = forms.EmailField()


class SetCredentialsForm(forms.Form):
    username = forms.CharField(min_length=2, max_length=150)
    password = forms.CharField(widget=forms.PasswordInput, min_length=8)

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('Username already taken.')
        return username


class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)