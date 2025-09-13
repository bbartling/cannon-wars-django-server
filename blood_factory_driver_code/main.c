#include <emscripten.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

#define MAX_ENEMIES 1
#define PLAYER_MAX_HEALTH 100
#define SKELETON_MAX_HEALTH 50

typedef enum {
    PLAYER_STATE_IDLE, PLAYER_STATE_RUNNING, PLAYER_STATE_ATTACKING, PLAYER_STATE_HIT, PLAYER_STATE_DEAD
} PlayerState;

typedef enum {
    ENEMY_STATE_WANDERING, ENEMY_STATE_IDLE, ENEMY_STATE_CHASING, ENEMY_STATE_ATTACKING, ENEMY_STATE_HIT, ENEMY_STATE_DYING
} EnemyState;

typedef struct {
    float x, y;
    int health;
    PlayerState state;
    float animation_timer;
} Player;

// --- UPDATED STRUCT: Has both timers now ---
typedef struct {
    float x, y, vx, vy;
    int health;
    EnemyState state;
    float animation_timer; // For one-shot animations (attack, hit, death)
    float state_timer;     // For timed states (wander, idle)
    float attack_cooldown;
} Enemy;

static Player player;
static Enemy enemies[MAX_ENEMIES];
static bool player_moved_this_frame;
static float world_width  = 800.0f;
static float world_height = 600.0f;
static bool game_over;

void damage_player(int amount);
void damage_enemy(int index, int amount);

EMSCRIPTEN_KEEPALIVE void set_screen_size(int w, int h) { world_width = (float)w; world_height = (float)h; }

EMSCRIPTEN_KEEPALIVE
void init_game() {
    player.x = world_width / 2.0f;
    player.y = world_height / 2.0f;
    player.health = PLAYER_MAX_HEALTH;
    player.state = PLAYER_STATE_IDLE;
    player.animation_timer = 0.0f;

    enemies[0].health = SKELETON_MAX_HEALTH;
    enemies[0].x = world_width / 2.0f + 150.0f;
    enemies[0].y = world_height / 2.0f;
    enemies[0].state = ENEMY_STATE_IDLE;
    enemies[0].animation_timer = 0.0f;
    enemies[0].state_timer = 2.0f; // Start by being idle for 2 seconds
    enemies[0].attack_cooldown = 0.0f;

    game_over = false;
}

EMSCRIPTEN_KEEPALIVE
void update_game(float dt) {
    if (player.state == PLAYER_STATE_DEAD) {
        if (player.animation_timer > 0) player.animation_timer -= dt;
        return;
    }

    if (player.animation_timer > 0) {
        player.animation_timer -= dt;
        if (player.animation_timer <= 0) player.state = PLAYER_STATE_IDLE;
    } else if (player.state == PLAYER_STATE_RUNNING && !player_moved_this_frame) {
        player.state = PLAYER_STATE_IDLE;
    }
    player_moved_this_frame = false;

    Enemy* skeleton = &enemies[0];
    if (skeleton->health <= 0) {
        if (skeleton->state != ENEMY_STATE_DYING) {
             skeleton->state = ENEMY_STATE_DYING;
             skeleton->animation_timer = 1.5f;
             game_over = true;
        } else {
            if (skeleton->animation_timer > 0) skeleton->animation_timer -= dt;
        }
        return;
    }
    
    if (skeleton->animation_timer > 0) {
        skeleton->animation_timer -= dt;
        if (skeleton->animation_timer <= 0) skeleton->state = ENEMY_STATE_IDLE;
    }
    if (skeleton->attack_cooldown > 0) skeleton->attack_cooldown -= dt;

    float dx = player.x - skeleton->x;
    float dy = player.y - skeleton->y;
    float distance_sq = dx * dx + dy * dy;

    if (skeleton->animation_timer <= 0) { // Can only change state if not in a non-interruptible animation
        if (distance_sq < 60.0f * 60.0f && skeleton->attack_cooldown <= 0) {
            skeleton->state = ENEMY_STATE_ATTACKING;
            skeleton->animation_timer = 0.8f;
            skeleton->attack_cooldown = 2.0f;
            if (distance_sq < 70.0f * 70.0f) damage_player(15);
        } else if (distance_sq < 300.0f * 300.0f) {
            skeleton->state = ENEMY_STATE_CHASING;
            float distance = sqrtf(distance_sq);
            float speed = 70.0f;
            skeleton->vx = (dx / distance) * speed;
            skeleton->vy = (dy / distance) * speed;
        } else {
            if(skeleton->state == ENEMY_STATE_CHASING) skeleton->state = ENEMY_STATE_IDLE;
            skeleton->state_timer -= dt;
            if (skeleton->state_timer <= 0) {
                 if (skeleton->state == ENEMY_STATE_WANDERING) {
                    skeleton->state = ENEMY_STATE_IDLE;
                    skeleton->state_timer = 1.0f + (float)(rand()%2000)/1000.0f;
                } else { // Was idle
                    skeleton->state = ENEMY_STATE_WANDERING;
                    skeleton->state_timer = 2.0f + (float)(rand()%3000)/1000.0f;
                    float angle = ((float)rand()/(float)RAND_MAX) * 2.0f * 3.14159f;
                    float speed = 50.0f;
                    skeleton->vx = cos(angle) * speed;
                    skeleton->vy = sin(angle) * speed;
                }
            }
        }
    }
    
    if (skeleton->state == ENEMY_STATE_WANDERING || skeleton->state == ENEMY_STATE_CHASING) {
        skeleton->x += skeleton->vx * dt;
        skeleton->y += skeleton->vy * dt;
    }
}

EMSCRIPTEN_KEEPALIVE void move_player(float dx, float dy) {
    if (player.animation_timer > 0) return;
    player.x += dx; player.y += dy;
    player.state = PLAYER_STATE_RUNNING;
    player_moved_this_frame = true;
}

EMSCRIPTEN_KEEPALIVE void player_attack() {
    if (player.animation_timer > 0) return;
    player.state = PLAYER_STATE_ATTACKING;
    player.animation_timer = 0.6f;
    float dx = enemies[0].x - player.x;
    float dy = enemies[0].y - player.y;
    if (dx*dx + dy*dy < 80.0f * 80.0f) damage_enemy(0, 20);
}

void damage_player(int amount) {
    if (player.state == PLAYER_STATE_HIT || player.state == PLAYER_STATE_DEAD) return;
    player.health -= amount;
    if (player.health <= 0) {
        player.health = 0;
        player.state = PLAYER_STATE_DEAD;
        player.animation_timer = 2.0f;
        game_over = true;
    } else {
        player.state = PLAYER_STATE_HIT;
        player.animation_timer = 0.4f;
    }
}

void damage_enemy(int index, int amount) {
    if (enemies[index].state == ENEMY_STATE_HIT || enemies[index].state == ENEMY_STATE_DYING) return;
    enemies[index].health -= amount;
    if (enemies[index].health > 0) {
        enemies[index].state = ENEMY_STATE_HIT;
        enemies[index].animation_timer = 0.4f;
    }
}

EMSCRIPTEN_KEEPALIVE float get_player_x() { return player.x; }
EMSCRIPTEN_KEEPALIVE float get_player_y() { return player.y; }
EMSCRIPTEN_KEEPALIVE int get_player_state() { return (int)player.state; }
EMSCRIPTEN_KEEPALIVE int get_player_health() { return player.health; }
EMSCRIPTEN_KEEPALIVE int get_num_enemies() { return MAX_ENEMIES; }
EMSCRIPTEN_KEEPALIVE float get_enemy_x(int i) { return enemies[i].x; }
EMSCRIPTEN_KEEPALIVE float get_enemy_y(int i) { return enemies[i].y; }
EMSCRIPTEN_KEEPALIVE int get_enemy_state(int i) { return (int)enemies[i].state; }
EMSCRIPTEN_KEEPALIVE int is_enemy_alive(int i) { return enemies[i].health > 0; }
EMSCRIPTEN_KEEPALIVE int is_game_over() { return game_over; }
EMSCRIPTEN_KEEPALIVE int get_score() { return (enemies[0].health <= 0) ? SKELETON_MAX_HEALTH : 0; }