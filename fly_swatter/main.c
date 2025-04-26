#include <stdio.h>
#include <stdlib.h>
#include <emscripten.h>

int ball_x = 10;
int ball_y = 10;
int ball_dx = 1;
int ball_dy = 1;

int screen_width = 300;  // Default values
int screen_height = 150;

EMSCRIPTEN_KEEPALIVE
void set_screen_size(int w, int h) {
    screen_width = w;
    screen_height = h;
    printf("Screen size set: %d x %d\n", screen_width, screen_height);
}

EMSCRIPTEN_KEEPALIVE
void update() {
    ball_x += ball_dx;
    ball_y += ball_dy;

    if (ball_x <= 0 || ball_x >= screen_width) ball_dx = -ball_dx;
    if (ball_y <= 0 || ball_y >= screen_height) ball_dy = -ball_dy;

    // You can comment this printf out later to speed things up
    //printf("Ball position: (%d, %d)\n", ball_x, ball_y);
}

EMSCRIPTEN_KEEPALIVE
int get_ball_x() { return ball_x; }

EMSCRIPTEN_KEEPALIVE
int get_ball_y() { return ball_y; }
