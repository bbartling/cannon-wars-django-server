# /home/FuffyTheBear/twtag/games/forms.py

from django import forms
from django.utils.text import slugify
from .models import Game
import re

SAFE_DIR_RE = re.compile(r"^[a-zA-Z0-9_\-]+$")  # kept in case you still use it elsewhere


class GameForm(forms.ModelForm):
    """
    Form for creating and editing Game instances.

    This version removes the platform‑specific zip fields and instead exposes a single
    URL field players will click to play the game. The "external_download_url"
    property on the model is repurposed as the play URL. During cleaning the
    URL will have a scheme added if missing. Placeholders and help text have
    been updated to reflect a physics simulation theme.
    """

    class Meta:
        model = Game
        # Only expose the relevant fields. The zip fields are intentionally
        # omitted so the admin UI no longer offers direct download uploads.
        fields = [
            "title",
            "slug",
            "short_desc",
            "tags",
            "thumbnail",
            "external_download_url",
            "published",
            "order",
            "web_zip",   
        ]

        widgets = {
            "title": forms.TextInput(attrs={
                "placeholder": "Physics Playground",
                "autocomplete": "off",
            }),
            "slug": forms.TextInput(attrs={
                "placeholder": "physics-playground",
                "autocomplete": "off",
            }),
            "short_desc": forms.Textarea(attrs={
                "rows": 4,
                "placeholder": "Explore gravity, collisions and more in this simulation…",
            }),
            "tags": forms.TextInput(attrs={
                "placeholder": "Physics, Simulation, Experiment",
            }),
            "order": forms.NumberInput(attrs={
                "placeholder": "0",
            }),
            "external_download_url": forms.URLInput(attrs={
                "placeholder": "https://example.com/webgl-build/index.html",
                "autocomplete": "off",
            }),
        }

        labels = {
            "external_download_url": "Play URL",
        }

        help_texts = {
            "external_download_url": (
                "Enter the full URL of the WebGL build's index page. "
                "Players will click the ‘Play’ button to open this link. "
                "Leave blank if your simulation isn't hosted yet."
            ),
        }

    # keep your quality-of-life behavior
    def clean(self):
        cleaned = super().clean()

        # auto‑slug from title if slug not provided
        title = (cleaned.get("title") or "").strip()
        slug = (cleaned.get("slug") or "").strip()
        if title and not slug:
            cleaned["slug"] = slugify(title)

        # normalize tags to "a, b, c"
        tags = cleaned.get("tags") or ""
        cleaned["tags"] = ", ".join([t.strip() for t in tags.split(",") if t.strip()])

        return cleaned

    def clean_external_download_url(self):
        """
        Clean the external download/play URL. Allows blank strings and automatically
        prefixes a scheme if the user enters a bare domain. This lets people
        enter things like `example.com/game` instead of typing out the full
        `https://example.com/game`.
        """
        url = (self.cleaned_data.get("external_download_url") or "").strip()
        if not url:
            return url
        # If no scheme is present, assume https
        if not (url.startswith("http://") or url.startswith("https://")):
            url = "https://" + url
        return url

    # Deprecated: zip fields no longer appear in the form, but these methods
    # remain to avoid raising AttributeError if the model still defines them.
    def clean_windows_zip(self):
        return self.cleaned_data.get("windows_zip")

    def clean_mac_zip(self):
        return self.cleaned_data.get("mac_zip")
