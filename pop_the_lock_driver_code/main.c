#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <math.h>
#include <time.h>
#include <emscripten.h>

// Game settings
#define HIT_TOLERANCE 0.15f
#define MAX_HITS 15

// Game state
int screen_width = 800;
int screen_height = 600;
float angle = 0.0f;
float speed = 2.0f;
float direction = 1.0f;
float target_angle = 0.0f;
int score = 0;
bool game_over = false;
bool game_won = false;

// --- NEW LOGIC FOR TIGHTER ARC ---
// This variable will track which way the target should jump (left or right).
float target_arc_direction = 1.0f; 

double last_update_time = 0.0;

EMSCRIPTEN_KEEPALIVE
void set_screen_size(int w, int h) {
    screen_width = w;
    screen_height = h;
}

float rand_angle() {
    return ((float)rand() / (float)RAND_MAX) * 2.0f * M_PI;
}

EMSCRIPTEN_KEEPALIVE
void reset_game() {
    srand(time(NULL));
    angle = 0.0f;
    speed = 2.0f;
    direction = 1.0f;
    score = 0;
    game_over = false;
    game_won = false;
    target_angle = rand_angle();
    target_arc_direction = 1.0f; // Reset arc direction
    last_update_time = emscripten_get_now();
}

EMSCRIPTEN_KEEPALIVE
void tap_event() {
    if (game_over || game_won) return;

    float diff = fabsf(angle - target_angle);
    if (diff > M_PI) diff = 2.0f * M_PI - diff;

    if (diff < HIT_TOLERANCE) {
        score++;
        speed += 0.15f;
        direction *= -1.0f;

        // --- NEW ARC CALCULATION ---
        // Start with a 180-degree arc (M_PI) and reduce it towards a 
        // minimum of a 45-degree arc (M_PI / 4) as the score increases.
        float max_arc = M_PI;
        float min_arc = M_PI / 4.0f;
        float progress = (float)score / (float)MAX_HITS;
        float arc_span = max_arc - (progress * (max_arc - min_arc));

        // Move the target by the new arc span
        target_angle += arc_span * target_arc_direction;

        // Flip the direction for the next jump so it goes back and forth
        target_arc_direction *= -1.0f;

        // Keep the target angle within the 0 to 2*PI range
        if (target_angle > 2.0f * M_PI) target_angle -= 2.0f * M_PI;
        if (target_angle < 0.0f) target_angle += 2.0f * M_PI;

        if (score >= MAX_HITS) {
            game_won = true;
        }
    } else {
        game_over = true;
    }
}

EMSCRIPTEN_KEEPALIVE
float get_bar_angle() {
    if (!game_over && !game_won) {
        double now = emscripten_get_now();
        float dt = (float)((now - last_update_time) / 1000.0);
        last_update_time = now;
        angle += speed * direction * dt;
        if (angle > 2.0f * M_PI) angle -= 2.0f * M_PI;
        if (angle < 0.0f) angle += 2.0f * M_PI;
    }
    return angle;
}

EMSCRIPTEN_KEEPALIVE
float get_target_angle() { return target_angle; }

EMSCRIPTEN_KEEPALIVE
int is_game_over() { return game_over ? 1 : 0; }

EMSCRIPTEN_KEEPALIVE
int get_score() { return score; }

EMSCRIPTEN_KEEPALIVE
int is_game_won() { return game_won ? 1 : 0; }