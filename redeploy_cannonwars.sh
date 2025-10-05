#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/diy_django"
VENV="$HOME/.virtualenvs/diy_django-venv"

cd "$APP_DIR"
git pull --ff-only || true

source "$VENV/bin/activate"

if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

python manage.py migrate
python manage.py collectstatic --noinput

# Reload PA web app
pa_reload_webapp bensApi.pythonanywhere.com 2>/dev/null || true
echo "Redeploy complete. If not auto-reloaded, click Reload on the Web tab."
