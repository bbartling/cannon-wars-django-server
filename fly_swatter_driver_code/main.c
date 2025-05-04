#include <stdio.h>
#include <stdlib.h>
#include <emscripten.h>
#include <stdbool.h>
#include <math.h>
#include <time.h>

#define MAX_FLIES 100

typedef enum {
    STATE_FLYING,
    STATE_LANDED
} FlyState;

typedef struct {
    float x;
    float y;
    float vx;
    float vy;
    float angle;
    bool alive;
    FlyState state;
    float state_timer; // time remaining in current state
} Fly;


Fly flies[MAX_FLIES];
int num_flies = 0;
int screen_width = 800;
int screen_height = 600;

EMSCRIPTEN_KEEPALIVE
void set_screen_size(int w, int h) {
    screen_width = w;
    screen_height = h;
    printf("Screen size set: %d x %d\n", screen_width, screen_height);
}


EMSCRIPTEN_KEEPALIVE
void create_fly() {
    if (num_flies < MAX_FLIES) {
        flies[num_flies].x = rand() % screen_width;
        flies[num_flies].y = rand() % screen_height;
        flies[num_flies].vx = ((rand() % 1000) / 500.0f - 1.0f) * 5.0f;
        flies[num_flies].vy = ((rand() % 1000) / 500.0f - 1.0f) * 5.0f;
        flies[num_flies].angle = 0;
        flies[num_flies].alive = true;
        flies[num_flies].state = STATE_FLYING;
        flies[num_flies].state_timer = 2.0f + ((rand() % 4000) / 1000.0f); // 2–6 sec
        num_flies++;
    }
}

EMSCRIPTEN_KEEPALIVE
void update_flies(float delta_time, float game_time_remaining) {
    float max_pause = fminf(6.0f, game_time_remaining);

    for (int i = 0; i < num_flies; i++) {
        if (!flies[i].alive) continue;

        flies[i].state_timer -= delta_time;

        if (flies[i].state_timer <= 0) {
            if (flies[i].state == STATE_FLYING) {
                flies[i].state = STATE_LANDED;
                flies[i].state_timer = 2.0f + ((rand() % 4000) / 1000.0f) * (max_pause / 6.0f);
            } else {
                flies[i].state = STATE_FLYING;
                flies[i].state_timer = 2.0f + ((rand() % 4000) / 1000.0f);
            }
        }

        if (flies[i].state == STATE_FLYING) {
            flies[i].x += flies[i].vx;
            flies[i].y += flies[i].vy;
            flies[i].angle = atan2f(flies[i].vy, flies[i].vx);

            if (flies[i].x <= 0 || flies[i].x >= screen_width) flies[i].vx = -flies[i].vx;
            if (flies[i].y <= 0 || flies[i].y >= screen_height) flies[i].vy = -flies[i].vy;
        }
    }
}


EMSCRIPTEN_KEEPALIVE
float get_fly_x(int index) {
    if (index < num_flies) return flies[index].x;
    return -1;
}

EMSCRIPTEN_KEEPALIVE
float get_fly_y(int index) {
    if (index < num_flies) return flies[index].y;
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int is_fly_alive(int index) {
    if (index < num_flies) return flies[index].alive ? 1 : 0;
    return 0;
}

EMSCRIPTEN_KEEPALIVE
int get_num_flies() {
    return num_flies;
}

EMSCRIPTEN_KEEPALIVE
float get_fly_angle(int index) {
    if (index < num_flies) return flies[index].angle;
    return 0.0f;
}

EMSCRIPTEN_KEEPALIVE
void attempt_swat(float mx, float my) {
    for (int i = 0; i < num_flies; i++) {
        if (flies[i].alive) {
            float dx = flies[i].x - mx;
            float dy = flies[i].y - my;
            if ((dx*dx + dy*dy) < (30.0f * 30.0f)) { // 30 = swat radius
                flies[i].alive = false;
            }
        }
    }
}

EMSCRIPTEN_KEEPALIVE
int is_fly_flying(int index) {
    if (index < num_flies) return flies[index].state == STATE_FLYING ? 1 : 0;
    return 0;
}
