# Django Games Comments

This project is a Django rewrite of the browser games site originally built with Flask.  It adds a simple
blog‐style comments system with email verification and login, while keeping the static game assets and
templates separate.  Guests can play the games without an account, but only verified users can post
comments on each game’s page.


---
## Clone Emscripten SDK
* In Ubuntu flavored WSL

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```
---

## Fly Swatter make Web Assembly Notes
* In root dir in WSL

Set make for path for emsdk. Compile the fly swatter game and put `.wasm` and glue code right into the Flask apps `static` directory to be served with web app for game play.
```bash
cd /mnt/c/Users/ben/Documents/wasm-fun/
source emsdk/emsdk_env.sh

emcc fly_swatter_driver_code/main.c -o static/fly_swatter.js \
  -sEXPORTED_FUNCTIONS=_set_screen_size,_create_fly,_update_flies,_get_fly_x,_get_fly_y,_is_fly_alive,_get_num_flies,_attempt_swat,_get_fly_angle \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
  -sNO_EXIT_RUNTIME=1 \
  -sALLOW_MEMORY_GROWTH=1
```

## Pop the lock make Web Assembly Notes
* In root dir in WSL

```bash
cd /mnt/c/Users/ben/Documents/wasm-fun/

# Step 1: Load emsdk environment
source emsdk/emsdk_env.sh

# Step 2: Compile Pop the Lock C to WASM + JS
emcc pop_the_lock_driver_code/main.c -O3 -o static/pop_the_lock.js \
  -s EXPORTED_FUNCTIONS='["_set_screen_size", "_tap_event", "_get_bar_angle", "_get_target_angle", "_is_game_over", "_reset_game"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -s NO_EXIT_RUNTIME=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1

# If you extend the pop_the_lock driver with additional exported functions (e.g. <code>get_score</code> and <code>is_game_won</code>),
# be sure to include them in the <code>EXPORTED_FUNCTIONS</code> list.  For example:

emcc pop_the_lock_driver_code/main.c -O3 -o static/pop_the_lock.js \
  -s EXPORTED_FUNCTIONS='["_set_screen_size","_tap_event","_get_bar_angle","_get_target_angle","_is_game_over","_reset_game","_get_score","_is_game_won"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -s NO_EXIT_RUNTIME=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1

```

## sound trimmer and pixel art site notes
mp3cut.net
https://www.pixilart.com/


## .env 

```bash
## Configuration

# Security
SECRET_KEY=replace-with-a-long-random-secret-key
DEBUG=1

# Database (using default SQLite, no config needed here)

# Email settings (for dev, emails just print to console)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@example.com

# --- If you want to use Gmail SMTP instead of console backend ---
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=1
# EMAIL_HOST_USER=yourgmail@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password   # must be an App Password if 2FA is enabled
# DEFAULT_FROM_EMAIL=yourgmail@gmail.com

```

3. **Open a Bash console** on PythonAnywhere and create a virtual environment:

```bash
python3 -m venv ~/envs/django-games-env
source ~/envs/django-games-env/bin/activate
pip install django
```

```bash
cd ~/mysite/django_games_comments
python manage.py migrate
```


## Testing routes with curl

A convenience script `run_and_curl.sh` is provided to perform a basic smoke test of the key routes.
It migrates the database, starts the development server, curls a set of paths, prints the HTTP
status codes, and stops the server.

To run it from the project directory (where `manage.py` lives):

```bash
bash run_and_curl.sh
```

```bash
python manage.py runserver 127.0.0.1:8000
```

