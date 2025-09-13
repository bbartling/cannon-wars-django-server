# ------------------------------------------------------------
# Stage 1: Build WebAssembly artifacts using Emscripten (emsdk)
# ------------------------------------------------------------
FROM emscripten/emsdk:3.1.68 AS wasm-builder

WORKDIR /src

# Copy only the C sources needed to compile the two games
# Adjust these paths if your project structure differs
COPY fly_swatter_driver_code/ fly_swatter_driver_code/
COPY pop_the_lock_driver_code/ pop_the_lock_driver_code/

# Output directory that will be copied into the final image
RUN mkdir -p static

# --- Build Fly Swatter ---
# Based on the flags used in your README
# Produces: static/fly_swatter.js + static/fly_swatter.wasm
RUN emcc fly_swatter_driver_code/main.c -O3 -o static/fly_swatter.js \
  -sEXPORTED_FUNCTIONS=_set_screen_size,_create_fly,_update_flies,_get_fly_x,_get_fly_y,_is_fly_alive,_get_num_flies,_attempt_swat,_get_fly_angle \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
  -sNO_EXIT_RUNTIME=1 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sWASM=1

# --- Build Pop The Lock ---
# Produces: static/pop_the_lock.js + static/pop_the_lock.wasm
RUN emcc pop_the_lock_driver_code/main.c -O3 -o static/pop_the_lock.js \
  -s EXPORTED_FUNCTIONS='["_set_screen_size","_tap_event","_get_bar_angle","_get_target_angle","_is_game_over","_reset_game"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -s NO_EXIT_RUNTIME=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1

# ------------------------------------------------------------
# Stage 2: Runtime image (Python + Gunicorn + your Flask app)
# ------------------------------------------------------------
FROM python:3.12-slim AS app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# If you have a requirements.txt, copy & install it; else install minimal deps
# COPY requirements.txt ./
# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir Flask gunicorn

# Copy your app code
COPY . .

# Ensure profanity.txt exists so the app doesn't fail on startup
# (Your app reads "profanity.txt" on import)
RUN test -f profanity.txt || printf "" > profanity.txt

# Bring in the WASM + JS artifacts from the builder stage
COPY --from=wasm-builder /src/static ./static

EXPOSE 5000

# Production server
# Expose Flask port and run
ENV FLASK_APP=app.py \
    FLASK_RUN_HOST=0.0.0.0 \
    FLASK_RUN_PORT=5000

CMD ["python", "app.py"]
