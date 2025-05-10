#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <termios.h>
#include <fcntl.h>
#include <time.h>

#define WIDTH 10
#define HEIGHT 20

int board[HEIGHT][WIDTH] = {0};
int score = 0;

// Tetrimino shapes
int shapes[7][4][4] = {
    { {1,1,1,1}, {0} },             // I
    { {1,1}, {1,1} },               // O
    { {0,1,0}, {1,1,1} },           // T
    { {1,0,0}, {1,1,1} },           // L
    { {0,0,1}, {1,1,1} },           // J
    { {1,1,0}, {0,1,1} },           // S
    { {0,1,1}, {1,1,0} }            // Z
};

typedef struct {
    int shape[4][4];
    int w, h;
} Tetrimino;

void enable_raw_mode() {
    struct termios term;
    tcgetattr(STDIN_FILENO, &term);
    term.c_lflag &= ~(ICANON | ECHO);
    tcsetattr(STDIN_FILENO, TCSANOW, &term);
}

void disable_raw_mode() {
    struct termios term;
    tcgetattr(STDIN_FILENO, &term);
    term.c_lflag |= (ICANON | ECHO);
    tcsetattr(STDIN_FILENO, TCSANOW, &term);
}

void set_nonblocking_input() {
    fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK);
}

Tetrimino spawn_new_piece() {
    Tetrimino t = { .w = 4, .h = 4 };
    int r = rand() % 7;
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            t.shape[i][j] = shapes[r][i][j];
    return t;
}

void rotate_tetrimino(Tetrimino *t) {
    int temp[4][4] = {0};
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            temp[j][3 - i] = t->shape[i][j];
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            t->shape[i][j] = temp[i][j];
}

int check_collision(Tetrimino t, int x, int y) {
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            if (t.shape[i][j]) {
                int nx = x + j;
                int ny = y + i;
                if (nx < 0 || nx >= WIDTH || ny >= HEIGHT || (ny >= 0 && board[ny][nx]))
                    return 1;
            }
    return 0;
}

void lock_tetrimino(Tetrimino t, int x, int y) {
    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            if (t.shape[i][j]) {
                int nx = x + j;
                int ny = y + i;
                if (ny >= 0 && nx >= 0 && nx < WIDTH && ny < HEIGHT)
                    board[ny][nx] = 1;
            }
}

void clear_full_rows() {
    for (int row = HEIGHT - 1; row >= 0; row--) {
        int full = 1;
        for (int col = 0; col < WIDTH; col++) {
            if (!board[row][col]) {
                full = 0;
                break;
            }
        }
        if (full) {
            score += 100;
            for (int r = row; r > 0; r--)
                for (int col = 0; col < WIDTH; col++)
                    board[r][col] = board[r - 1][col];
            for (int col = 0; col < WIDTH; col++)
                board[0][col] = 0;
            row++; // recheck the same row
        }
    }
}

void draw(Tetrimino t, int x, int y) {
    printf("\033[H\033[J");
    printf("Score: %d\n\n", score);
    for (int row = 0; row < HEIGHT; row++) {
        for (int col = 0; col < WIDTH; col++) {
            int occupied = board[row][col];
            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 4; j++)
                    if (t.shape[i][j] && row == y + i && col == x + j)
                        occupied = 1;
            printf("%c ", occupied ? '#' : '.');
        }
        printf("\n");
    }
}

int main() {
    srand(time(NULL));
    enable_raw_mode();
    set_nonblocking_input();

    int x = 3, y = 0;
    Tetrimino t = spawn_new_piece();
    int tick = 0;

    while (1) {
        draw(t, x, y);

        char c = getchar();
        if (c == 'a' && !check_collision(t, x - 1, y)) x--;
        else if (c == 'd' && !check_collision(t, x + 1, y)) x++;
        else if (c == 's' && !check_collision(t, x, y + 1)) y++;
        else if (c == 'w') {
            Tetrimino temp = t;
            rotate_tetrimino(&temp);
            if (!check_collision(temp, x, y)) rotate_tetrimino(&t);
        }
        else if (c == 'q') break;

        usleep(100000);
        tick++;
        if (tick >= 5) {
            tick = 0;
            if (!check_collision(t, x, y + 1)) {
                y++;
            } else {
                lock_tetrimino(t, x, y);
                clear_full_rows();
                t = spawn_new_piece();
                x = 3; y = 0;
                if (check_collision(t, x, y)) {
                    draw(t, x, y);
                    printf("\nGAME OVER!\nFinal Score: %d\n", score);
                    break;
                }
            }
        }
    }

    disable_raw_mode();
    return 0;
}
