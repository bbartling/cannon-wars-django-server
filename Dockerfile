# ------------------------------------------------------------
# Stage 1: Build WebAssembly artifacts using Emscripten (emsdk)
# ------------------------------------------------------------
FROM emscripten/emsdk:3.1.68 AS wasm-builder

WORKDIR /src

# Copy the C sources for all three games into the builder stage
COPY fly_swatter_driver_code/ fly_swatter_driver_code/
COPY pop_the_lock_driver_code/ pop_the_lock_driver_code/
COPY blood_factory_driver_code/ blood_factory_driver_code/
COPY mario_driver_code/ mario_driver_code/

# Output directory that will be copied into the final image
RUN mkdir -p static

# --- Build Fly Swatter ---
RUN emcc fly_swatter_driver_code/main.c -O3 -o static/fly_swatter.js \
  -sEXPORTED_FUNCTIONS=_set_screen_size,_create_fly,_update_flies,_get_fly_x,_get_fly_y,_is_fly_alive,_get_num_flies,_attempt_swat,_get_fly_angle \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
  -sNO_EXIT_RUNTIME=1 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sWASM=1

# --- Build Pop The Lock ---
RUN emcc pop_the_lock_driver_code/main.c -O3 -o static/pop_the_lock.js \
  -s EXPORTED_FUNCTIONS='["_set_screen_size","_tap_event","_get_bar_angle","_get_target_angle","_is_game_over","_reset_game"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -s NO_EXIT_RUNTIME=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1

# --- Build Blood Factory ---
RUN echo "[emsdk] Compiling Blood Factory ..." && \
    emcc blood_factory_driver_code/main.c -O3 -o static/blood_factory.js \
      -s EXPORTED_FUNCTIONS='["_set_screen_size","_init_game","_update_game","_move_player","_player_attack","_get_player_x","_get_player_y","_get_num_enemies","_get_enemy_x","_get_enemy_y","_is_enemy_alive","_is_game_over","_get_score"]' \
      -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
      -s NO_EXIT_RUNTIME=1 \
      -s ALLOW_MEMORY_GROWTH=1 \
      -s WASM=1

# --- Build Mario Maker ---
RUN echo "[emsdk] Compiling Mario Game ..." && \
    emcc mario_driver_code/main.c -O3 -o static/mario_engine.js \
      -s EXPORTED_FUNCTIONS='["_load_level","_init_game","_update_game","_get_player_x","_get_player_y","_get_level_width","_get_level_height","_get_tile","_get_num_enemies","_get_enemy_x","_get_enemy_y","_is_enemy_alive","_is_game_over"]' \
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

# Install Python dependencies
RUN pip install --no-cache-dir Flask gunicorn

# Copy your entire application code into the final image
COPY . .

# Ensure profanity.txt exists so the app doesn't fail on startup
RUN test -f profanity.txt || printf "" > profanity.txt

# Bring in the compiled WASM + JS artifacts from the builder stage
COPY --from=wasm-builder /src/static ./static

EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=app.py \
    FLASK_RUN_HOST=0.0.0.0 \
    FLASK_RUN_PORT=5000

# Command to run the application
CMD ["python", "app.py"]