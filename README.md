# 🧪 Unity Physics Hub — Developer Guide

```
python manage.py makemigrations games
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000

```

```
python manage.py findstatic home.css
python manage.py changepassword ben
```

```bash
zip -r ../physics_hub_code.zip . \
  -x "*/__pycache__/*" \
     "*.pyc" "*.pyo" \
     "*.sqlite3" "*.db" \
     "env/*" \
     "staticfiles/*" \
     "media/*" \
     ".git/*" \
     "*.log"
```

This excludes caches, virtual environments, the SQLite database and any uploaded media.
