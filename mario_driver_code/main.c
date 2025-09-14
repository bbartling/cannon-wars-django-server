/*
 * Mario Maker Game Engine (C)
 *
 * This file implements a simple side‑scrolling platformer in C that can be
 * compiled to WebAssembly using Emscripten. The engine is responsible for
 * loading a level grid, updating the player’s physics, handling collisions
 * against the tilemap, and managing simple enemy behaviour. Rendering and
 * user input are left entirely to JavaScript, which calls into this engine
 * via the exposed functions below.
 *
 * Tile values correspond to those defined in level.json:
 * 0 – empty
 * 1 – blue block (solid)
 * 2 – red block (solid)
 * 3 – Gumba enemy spawn (replaced with an Enemy at load time)
 */

#include <emscripten.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

/* --- Physics Constants --- */
#define GRAVITY 0.5f
#define JUMP_HEIGHT -10.0f
#define PLAYER_SPEED 3.0f
#define TERMINAL_VELOCITY 10.0f
#define MAX_ENEMIES 50

/* --- Tile Types --- */
#define TILE_EMPTY 0
#define TILE_BLUE_BLOCK 1
#define TILE_RED_BLOCK 2
#define TILE_GUMBA 3

/* --- Data Structures --- */
typedef struct {
    float x, y;
    float vx, vy;
    bool on_ground;
} Player;

typedef struct {
    float x, y;
    float vx, vy;
    bool is_alive;
    int direction;
} Enemy;

/* --- Global Game State --- */
static int level_width = 0;
static int level_height = 0;
static int **level_data = NULL;
static Player player;
static Enemy enemies[MAX_ENEMIES];
static int num_enemies = 0;
static bool game_over = false;
static const int cell_size = 10; /* must match JS value */

/* Free any previously allocated level grid */
static void free_level(void) {
    if (level_data != NULL) {
        for (int r = 0; r < level_height; r++) {
            free(level_data[r]);
        }
        free(level_data);
        level_data = NULL;
    }
    num_enemies = 0;
}

/* Parse a comma‑separated level string passed from JavaScript. The format is:
 * width,height,tile,tile,tile,...
 * Level data is stored row‑major in the string. Any Gumba tiles are
 * replaced with empty tiles and registered as Enemy objects.
 */
EMSCRIPTEN_KEEPALIVE
void load_level(char *data_string) {
    free_level();
    if (!data_string) return;
    char *token = strtok(data_string, ",");
    if (!token) return;
    level_width = atoi(token);
    token = strtok(NULL, ",");
    if (!token) return;
    level_height = atoi(token);
    if (level_width <= 0 || level_height <= 0) return;
    level_data = (int **)malloc(level_height * sizeof(int *));
    for (int r = 0; r < level_height; r++) {
        level_data[r] = (int *)malloc(level_width * sizeof(int));
    }
    for (int r = 0; r < level_height; r++) {
        for (int c = 0; c < level_width; c++) {
            token = strtok(NULL, ",");
            if (!token) {
                level_data[r][c] = TILE_EMPTY;
            } else {
                level_data[r][c] = atoi(token);
            }
        }
    }
}

/* Initialise or reset the game. Spawns enemies wherever the level grid
 * contains a TILE_GUMBA and removes those tiles from the map. Positions
 * the player at a default starting point.
 */
EMSCRIPTEN_KEEPALIVE
void init_game(void) {
    /* Reset player state */
    player.x = 50.0f;
    player.y = 50.0f;
    player.vx = 0.0f;
    player.vy = 0.0f;
    player.on_ground = false;
    /* Scan level for enemies */
    num_enemies = 0;
    for (int r = 0; r < level_height; r++) {
        for (int c = 0; c < level_width; c++) {
            if (level_data[r][c] == TILE_GUMBA && num_enemies < MAX_ENEMIES) {
                enemies[num_enemies].x = c * cell_size;
                enemies[num_enemies].y = r * cell_size;
                enemies[num_enemies].vx = -0.5f;
                enemies[num_enemies].vy = 0.0f;
                enemies[num_enemies].is_alive = true;
                enemies[num_enemies].direction = -1;
                num_enemies++;
                level_data[r][c] = TILE_EMPTY;
            }
        }
    }
    game_over = false;
}

/* Update function called from JavaScript every frame. It takes booleans for
 * left, right and jump inputs. Handles horizontal movement, jumping,
 * gravity, collision detection and simple enemy collision.
 */
EMSCRIPTEN_KEEPALIVE
void update_game(bool key_left, bool key_right, bool key_jump) {
    if (game_over) return;
    
    /* Horizontal movement */
    float air_control_factor = player.on_ground ? 1.0f : 0.7f;
    if (key_left) {
        player.vx = -PLAYER_SPEED * air_control_factor;
    } else if (key_right) {
        player.vx = PLAYER_SPEED * air_control_factor;
    } else {
        player.vx = 0.0f;
    }

    /* Jumping - only affects vertical velocity */
    if (key_jump && player.on_ground) {
        player.vy = JUMP_HEIGHT;
        player.on_ground = false;
    }
    
    /* Apply gravity */
    player.vy += GRAVITY;
    if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;
    
    /* Compute bounding box */
    float pw = cell_size;
    float ph = cell_size * 2;
    
    /* Move along X axis and check for collision */
    player.x += player.vx;
    int grid_x_left = (int)floor(player.x / cell_size);
    int grid_x_right = (int)floor((player.x + pw) / cell_size);

    for (int r = (int)floor(player.y / cell_size); r <= (int)floor((player.y + ph - 1) / cell_size); r++) {
        if (r < 0 || r >= level_height) continue;
        
        /* Collision on left */
        if (player.vx < 0 && grid_x_left >= 0 && level_data[r][grid_x_left] > TILE_EMPTY) {
            // --- NEW: Check for lava ---
            if (level_data[r][grid_x_left] == TILE_RED_BLOCK) {
                game_over = true;
            }
            player.x = (grid_x_left + 1) * cell_size;
            break;
        }
        /* Collision on right */
        if (player.vx > 0 && grid_x_right < level_width && level_data[r][grid_x_right] > TILE_EMPTY) {
            // --- NEW: Check for lava ---
            if (level_data[r][grid_x_right] == TILE_RED_BLOCK) {
                game_over = true;
            }
            player.x = grid_x_right * cell_size - pw;
            break;
        }
    }

    /* Move along Y axis and check for collision */
    player.y += player.vy;
    player.on_ground = false;
    int grid_y_top = (int)floor(player.y / cell_size);
    int grid_y_bottom = (int)floor((player.y + ph) / cell_size);
    for (int c = (int)floor(player.x / cell_size); c <= (int)floor((player.x + pw) / cell_size); c++) {
        if (c < 0 || c >= level_width) continue;
        int tile_below = (grid_y_bottom < level_height) ? level_data[grid_y_bottom][c] : TILE_EMPTY;

        /* Collision on top */
        if (player.vy < 0 && grid_y_top >= 0 && level_data[grid_y_top][c] > TILE_EMPTY) {
             // --- NEW: Check for lava ---
            if (level_data[grid_y_top][c] == TILE_RED_BLOCK) {
                game_over = true;
            }
            player.y = (grid_y_top + 1) * cell_size;
            player.vy = 0.0f;
            break;
        }
        /* Collision on bottom (landing) */
        if (player.vy > 0 && tile_below > TILE_EMPTY) {
            // --- NEW: Check for lava ---
            if (tile_below == TILE_RED_BLOCK) {
                game_over = true;
            }
            player.y = grid_y_bottom * cell_size - ph;
            player.vy = 0.0f;
            player.on_ground = true;
            break;
        }
    }

    /* Player–enemy collision */
    for (int i = 0; i < num_enemies; i++) {
        if (!enemies[i].is_alive) continue;
        float ew = cell_size;
        float eh = cell_size;
        if (player.x < enemies[i].x + ew && player.x + pw > enemies[i].x &&
            player.y < enemies[i].y + eh && player.y + ph > enemies[i].y) {
            /* Stomp on enemy */
            if (player.vy > 0.0f && (player.y + ph) < (enemies[i].y + eh + player.vy)) {
                enemies[i].is_alive = false;
                player.vy = JUMP_HEIGHT / 1.5f;
            } else {
                game_over = true;
            }
        }
    }

    /* Falling off map triggers game over */
    if (player.y > (float)level_height * cell_size) {
        game_over = true;
    }
}

/* Getter functions for JavaScript to query game state */
EMSCRIPTEN_KEEPALIVE float get_player_x(void) { return player.x; }
EMSCRIPTEN_KEEPALIVE float get_player_y(void) { return player.y; }
EMSCRIPTEN_KEEPALIVE int get_level_width(void) { return level_width; }
EMSCRIPTEN_KEEPALIVE int get_level_height(void) { return level_height; }
EMSCRIPTEN_KEEPALIVE int get_tile(int r, int c) {
    if (!level_data || r < 0 || c < 0 || r >= level_height || c >= level_width) return TILE_EMPTY;
    return level_data[r][c];
}
EMSCRIPTEN_KEEPALIVE int get_num_enemies(void) { return num_enemies; }
EMSCRIPTEN_KEEPALIVE float get_enemy_x(int i) { return (i < num_enemies) ? enemies[i].x : -1.0f; }
EMSCRIPTEN_KEEPALIVE float get_enemy_y(int i) { return (i < num_enemies) ? enemies[i].y : -1.0f; }
EMSCRIPTEN_KEEPALIVE int is_enemy_alive(int i) { return (i < num_enemies && enemies[i].is_alive) ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int is_game_over(void) { return game_over ? 1 : 0; }