//
// Minimal stub loader for the Blood Factory game.  In the original
// project other games load a WebAssembly module compiled from C
// (via emcc) and then call into it through Module.cwrap().  Because
// this environment may not provide a compiled Wasm, this file
// declares a Module object and immediately invokes its
// onRuntimeInitialized callback.  When a real Wasm build is
// available it can be swapped in without modifying any HTML or
// JavaScript.  See blood_factory_driver_code/main.c for the C
// sources.
//

var Module = Module || {};

// Provide a basic cwrap implementation.  When compiled with
// Emscripten, Module.cwrap will be injected; here we fallback to
// looking up plain JavaScript functions attached directly to the
// Module object (defined in blood_factory_game.js).
Module.cwrap = Module.cwrap || function(name, returnType, argTypes) {
  return function() {
    var fn = Module[name];
    if (typeof fn === 'function') {
      return fn.apply(Module, arguments);
    } else {
      console.warn('BloodFactory stub: missing function ' + name);
      return undefined;
    }
  };
};

// Note: we deliberately do not automatically invoke
// Module.onRuntimeInitialized here.  When compiled with emcc the
// generated glue code will call it for us.  In the fallback
// implementation the call is made at the end of
// blood_factory_game.js after all functions are defined to avoid
// timing issues.