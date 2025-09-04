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
// Direction of rotation: 1 for clockwise, -1 for counter‑clockwise
int direction = 1;
float target_angle = 0.0f;

int score = 0;
// Set when the player misses the target
bool game_over = false;
// Set when the player reaches the maximum number of hits
bool game_won = false;
float delta_time = 0.016f; // ~60 FPS

// Number of successful pops required to win the game
#define MAX_HITS 15
// Tolerance for a successful hit (in radians)
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
    direction = 1;
    game_over = false;
    game_won = false;
    new_target();
    last_update_time = emscripten_get_now();
}

EMSCRIPTEN_KEEPALIVE
void tap_event() {
    // Ignore taps if the game has already ended (either win or lose)
    if (game_over || game_won) return;

    // Calculate shortest angular distance between the bar and the target
    float diff = fabsf(angle - target_angle);
    if (diff > M_PI) diff = 2 * M_PI - diff;

    if (diff < HIT_TOLERANCE) {
        // Successful hit
        score++;
        // Reverse direction and set the target to the opposite side of the circle
        direction = -direction;
        target_angle += M_PI;
        if (target_angle > 2 * M_PI) target_angle -= 2 * M_PI;
        // Gradually increase speed to ramp up difficulty
        speed += 0.1f;
        // Check for win condition
        if (score >= MAX_HITS) {
            game_won = true;
        }
    } else {
        // Missed the target
        game_over = true;
    }
}

EMSCRIPTEN_KEEPALIVE
float get_bar_angle() {
    if (!game_over && !game_won) {
        double now = emscripten_get_now();
        float dt = (float)((now - last_update_time) / 1000.0);
        last_update_time = now;

        // Update the angle based on direction and speed
        angle += direction * speed * dt;
        // Wrap the angle into [0, 2π)
        if (angle >= 2 * M_PI) angle -= 2 * M_PI;
        if (angle < 0) angle += 2 * M_PI;
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

// Return the current score (number of successful pops)
EMSCRIPTEN_KEEPALIVE
int get_score() {
    return score;
}

// Return 1 when the player has completed the required number of hits
EMSCRIPTEN_KEEPALIVE
int is_game_won() {
    return game_won ? 1 : 0;
}
