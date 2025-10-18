# --- top of settings.py ---
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV = os.getenv("DJANGO_ENV", "local")  # "local" or "prod"

DEBUG = (ENV != "prod")

if ENV == "prod":
    # PythonAnywhere domain
    ALLOWED_HOSTS = ["bensApi.pythonanywhere.com"]  # <- change to your PA subdomain
else:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Static/Media
STATIC_URL = "/static/"
MEDIA_URL = "/media/"

if ENV == "prod":
    # Absolute paths on PythonAnywhere
    STATIC_ROOT = BASE_DIR / "staticfiles"
    MEDIA_ROOT  = BASE_DIR / "media"
else:
    # Local dev
    STATICFILES_DIRS = [BASE_DIR / "static"]
    MEDIA_ROOT  = BASE_DIR / "media"
