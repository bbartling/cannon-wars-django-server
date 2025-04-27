# WASM Fun

A hobby project to create simple games with WebAssembly (C → WASM) and serve them using Flask.  
This is a learning playground for making browser-playable games using C, WebAssembly, and minimal JavaScript.

* https://bensapi.pythonanywhere.com/

---

## 📥 Setup

Clone Emscripten SDK:
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

Set make for path for emsdk
```bash
cd emsdk
./emsdk activate latest
source ./emsdk_env.sh
```

Compile wasm change back into the `fly_swatter_driver_code` directory
```bash
emcc main.c -o fly_swatter.js \
  -sEXPORTED_FUNCTIONS=_set_screen_size \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap \
  -sNO_EXIT_RUNTIME=1
```

