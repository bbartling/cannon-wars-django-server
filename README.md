# Cannon Wars

Unity Game served by a Django Web App

![Leave Temp Snip](https://raw.githubusercontent.com/bbartling/diy-browser-games/blob/develop/thumbnail.png)

## Run (Docker)
```bash
docker compose up --build
# visit http://localhost:8000/

docker compose down
```


## 🔹 Top-Level (Project Root)

```
WASM-FUN/
├─ manage.py
├─ docker-compose.yml
├─ Dockerfile
├─ requirements.txt
├─ db.sqlite3
├─ README.md, LICENSE
├─ thumbnail.png
├─ .gitignore, .dockerignore
```

* **manage.py** → entrypoint for Django commands (`runserver`, `migrate`, etc.).
* **docker-compose.yml** + **Dockerfile** → define your Dockerized app.
* **requirements.txt** → lists Python packages (Django, whitenoise, etc.).
* **db.sqlite3** → local SQLite database (auto-generated when you run `migrate`).
* **thumbnail.png** → shown on the home page as your game’s “cover art.”

---

## 🔹 Django Project Code

```
diy_django/
  ├─ settings.py   # Django configuration (STATICFILES_DIRS, DB, apps, etc.)
  ├─ urls.py       # project-wide URL routes
  ├─ wsgi.py, asgi.py
  └─ __init__.py
```

This is the “project” container. It wires everything together.

---

## 🔹 Django App Code (`game/`)

```
game/
  ├─ views.py      # home() and play() views
  ├─ urls.py       # app-specific URL routes
  ├─ templates/    # HTML templates
  ├─ static/       # (optional, app-specific static assets)
  ├─ models.py     # empty for now
  └─ __init__.py
```

* **templates/game/home.html** → the landing page (where you added “Welcome to Cannon Wars!”).
* **views.py** → handles logic: home shows the thumbnail, play redirects to Unity.

---

## 🔹 Unity Build Output

```
unity_build/
  ├─ index.html
  ├─ Build/
  └─ TemplateData/
```

This is where you **drop your Unity WebGL export**. Django’s `settings.py` and `urls.py` are already set up so these files are served directly at:

* `/unity/index.html` (the Unity build’s entrypoint)
* `/play/` (redirects to `/unity/index.html`)

---

## 🔹 Unity Source Project (optional)

```
unity_game_files/
  ├─ Assets/
  ├─ ProjectSettings/
  └─ ...
```

That looks like you dropped your full Unity project here.

* ✅ This is the **project you back up / put in Git**.
* ❌ Don’t serve this with Django — it’s just for editing/building in Unity.
* When you build, the **output goes into `unity_build/`** (that’s what Django/Docker actually serves).

---

## 🔹 How Docker makes it work

1. `docker-compose.yml` mounts your whole repo into the container (`volumes: - .:/app`).
2. `Dockerfile` installs Django, copies files, runs the dev server on `0.0.0.0:8000`.
3. Your host maps port `8000:8000`, so you hit `http://localhost:8000/`.

---

✅ So the flow is:

* **Edit/backup** → `unity_game_files/` (Unity source).
* **Build for WebGL** → output goes into `unity_build/`.
* **Serve/play in browser** → Django serves `unity_build/index.html` via `/play/` or `/unity/index.html`.

