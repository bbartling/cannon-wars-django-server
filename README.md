# WASM Fun

A hobby project to create simple games with WebAssembly (C → WASM) and serve them using Flask.  
This is a learning playground for making browser-playable games using C, WebAssembly, and minimal JavaScript.

* https://bensapi.pythonanywhere.com/

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

## sound trimmer notes
mp3cut.net


## Builds with Docker
```bash
docker-compose down
docker compose up -d --build
docker compose logs -f web

# Get wasms only
docker compose run --rm emsdk

# Dev: just rebuild WASMs into ./static without rebuilding the image
docker compose run --rm emsdk


docker system prune -a
```