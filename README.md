# WASM Fun

A hobby project to create simple games with WebAssembly (C → WASM) and serve them using Flask.  
This is a learning playground for making browser-playable games using C, WebAssembly, and minimal JavaScript.

* https://bensapi.pythonanywhere.com/

---

## 📥 Setup in WSL to compile C into .wasm

Clone Emscripten SDK:
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

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

