#!/usr/bin/env bash
set -euo pipefail

echo "[emsdk] Building WASM artifacts into ./static ..."

# Ensure output directory exists
mkdir -p static

# --- Fly Swatter ---
echo "[emsdk] Compiling Fly Swatter ..."
emcc fly_swatter_driver_code/main.c -O3 -o static/fly_swatter.js \
  -sEXPORTED_FUNCTIONS=_set_screen_size,_create_fly,_update_flies,_get_fly_x,_get_fly_y,_is_fly_alive,_get_num_flies,_attempt_swat,_get_fly_angle \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
  -sNO_EXIT_RUNTIME=1 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sWASM=1

# --- Pop The Lock ---
echo "[emsdk] Compiling Pop The Lock ..."
emcc pop_the_lock_driver_code/main.c -O3 -o static/pop_the_lock.js \
  -s EXPORTED_FUNCTIONS='["_set_screen_size","_tap_event","_get_bar_angle","_get_target_angle","_is_game_over","_reset_game"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -s NO_EXIT_RUNTIME=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s WASM=1

echo "[emsdk] Done. Artifacts:"
ls -l static/*.js static/*.wasm || true
