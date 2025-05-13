#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <math.h>
#include <time.h>
#include <emscripten.h>

int screen_width = 800;
int screen_height = 600;

float angle = 0.0f;
float speed = 2.0f; // radians per second
float target_angle = 0.0f;

int score = 0;
bool game_over = false;
float delta_time = 0.016f; // ~60 FPS

#define HIT_TOLERANCE 0.15f

// For timing inside WASM
double last_update_time = 0.0;

EMSCRIPTEN_KEEPALIVE
void set_screen_size(int w, int h) {
    screen_width = w;
    screen_height = h;
}

float rand_angle() {
    return ((float)rand() / RAND_MAX) * 2.0f * M_PI;
}

void new_target() {
    target_angle = rand_angle();
}

EMSCRIPTEN_KEEPALIVE
void reset_game() {
    angle = 0.0f;
    speed = 2.0f;
    score = 0;
    game_over = false;
    new_target();
    last_update_time = emscripten_get_now();
}

EMSCRIPTEN_KEEPALIVE
void tap_event() {
    if (game_over) return;

    float diff = fabsf(angle - target_angle);
    if (diff > M_PI) diff = 2 * M_PI - diff;

    if (diff < HIT_TOLERANCE) {
        score++;
        speed += 0.1f;
        new_target();
    } else {
        game_over = true;
    }
}

EMSCRIPTEN_KEEPALIVE
float get_bar_angle() {
    if (!game_over) {
        double now = emscripten_get_now();
        float dt = (float)((now - last_update_time) / 1000.0);
        last_update_time = now;

        angle += speed * dt;
        if (angle > 2 * M_PI) angle -= 2 * M_PI;
    }
    return angle;
}

EMSCRIPTEN_KEEPALIVE
float get_target_angle() {
    return target_angle;
}

EMSCRIPTEN_KEEPALIVE
int is_game_over() {
    return game_over ? 1 : 0;
}
