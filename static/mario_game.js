/*
 * Mario Maker Game (JavaScript)
 *
 * This file binds the C/WebAssembly engine to browser APIs. It handles
 * asset loading, input management, camera control, and drawing the
 * level, player and enemies on an HTML canvas. The game is started
 * by calling the globally exposed `window.startMarioGame()` function.
 */
console.log('🎮 Mario game JS loaded');

// --- CRITICAL FIX: Wrap in a function to control scope ---
(function(window) {
    'use strict';

    // Fallback engine for when WASM isn't compiled.
    (function() {
        var Module = window.Module = window.Module || {};
        if (typeof Module.cwrap === 'undefined') {
            Module.cwrap = function(name) {
                return function() {
                    var fn = Module[name];
                    if (typeof fn !== 'function') {
                        console.warn('Mario stub: missing function ' + name);
                        return;
                    }
                    return fn.apply(null, arguments);
                };
            };
        }
        if (typeof Module.load_level === 'undefined') {
            console.log('⚠️ Mario Maker: Using JavaScript fallback engine.');
            // Add stubs for all C functions here if you want a full JS fallback
        }
    })();


    /**
     * Starts the Mario game.
     * @param {Array<Array<number>>} levelData The level grid from the editor.
     */
    function startMarioGame(levelData) {
        console.log('🚀 Initialising Mario game with data from editor...');
        // --- C Function Wrappers ---
        const loadLevel = Module.cwrap('load_level', null, ['string']);
        const initGame = Module.cwrap('init_game', 'void', []);
        const updateGame = Module.cwrap('update_game', 'void', ['boolean', 'boolean', 'boolean']);
        const getPlayerX = Module.cwrap('get_player_x', 'number', []);
        const getPlayerY = Module.cwrap('get_player_y', 'number', []);
        const getLevelWidth = Module.cwrap('get_level_width', 'number', []);
        const getLevelHeight = Module.cwrap('get_level_height', 'number', []);
        const getTile = Module.cwrap('get_tile', 'number', ['number', 'number']);
        const getNumEnemies = Module.cwrap('get_num_enemies', 'number', []);
        const getEnemyX = Module.cwrap('get_enemy_x', 'number', ['number']);
        const getEnemyY = Module.cwrap('get_enemy_y', 'number', ['number']);
        const isEnemyAlive = Module.cwrap('is_enemy_alive', 'number', ['number']);
        const isGameOver = Module.cwrap('is_game_over', 'number', []);

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 10;
        const colors = { bg: '#639bff', blue: '#3b5998', red: '#d9534f' };
        
        const marioImg = new Image();
        marioImg.src = '/static/Mario.png';
        const gumbaImg = new Image();
        gumbaImg.src = '/static/Gumba.png';

        const keys = {};
        document.addEventListener('keydown', (e) => { keys[e.key] = true; });
        document.addEventListener('keyup', (e) => { keys[e.key] = false; });
        
        let gameWidth, gameHeight, cameraX = 0, cameraY = 0;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gameWidth = canvas.width;
            gameHeight = canvas.height;
        }
        window.addEventListener('resize', resizeCanvas);

        function arrayToLevelString(arr) {
            const height = arr.length;
            const width = arr[0].length;
            return `${width},${height},${arr.flat().join(',')}`;
        }

        function loadLevelAndStart() {
            if (!Array.isArray(levelData) || levelData.length === 0) {
                console.error("Cannot start game: No level data provided from the editor!");
                return;
            }
            const levelString = arrayToLevelString(levelData);
            loadLevel(levelString);
            initGame();
            resizeCanvas();
            requestAnimationFrame(gameLoop);
        }

        function drawScene() {
            const playerX = getPlayerX();
            const playerY = getPlayerY();
            const levelWidthPixels = getLevelWidth() * cellSize;
            const levelHeightPixels = getLevelHeight() * cellSize;
            const zoomFactor = 4;
            const visibleWidth = gameWidth / zoomFactor;
            const visibleHeight = gameHeight / zoomFactor;
            let targetX = playerX - visibleWidth / 2;
            let targetY = playerY - visibleHeight / 2;
            targetX = Math.max(0, Math.min(targetX, levelWidthPixels - visibleWidth));
            targetY = Math.max(0, Math.min(targetY, levelHeightPixels - visibleHeight));
            cameraX += (targetX - cameraX) * 0.1;
            cameraY += (targetY - cameraY) * 0.1;

            ctx.save();
            ctx.scale(zoomFactor, zoomFactor);
            ctx.translate(-cameraX, -cameraY);
            ctx.fillStyle = colors.bg;
            ctx.fillRect(cameraX, cameraY, visibleWidth, visibleHeight);

            const startCol = Math.floor(cameraX / cellSize);
            const endCol = startCol + Math.ceil(visibleWidth / cellSize);
            const startRow = Math.floor(cameraY / cellSize);
            const endRow = startRow + Math.ceil(visibleHeight / cellSize);

            for (let r = startRow; r < endRow; r++) {
                for (let c = startCol; c < endCol; c++) {
                    const tile = getTile(r, c);
                    if (tile === 1) {
                        ctx.fillStyle = colors.blue;
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    } else if (tile === 2) {
                        ctx.fillStyle = colors.red;
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    }
                }
            }
            
            const numEnemies = getNumEnemies();
            for(let i = 0; i < numEnemies; i++) {
                if (isEnemyAlive(i)) {
                    ctx.drawImage(gumbaImg, getEnemyX(i), getEnemyY(i), cellSize, cellSize);
                }
            }
            
            ctx.drawImage(marioImg, playerX, playerY, cellSize, cellSize * 2);
            ctx.restore();

            if (isGameOver()) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, gameWidth, gameHeight);
                ctx.fillStyle = 'white';
                ctx.font = '48px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', gameWidth / 2, gameHeight / 2);
            }
        }
        
        let animationFrameId = null;
        function gameLoop() {
            const keyLeft = keys['ArrowLeft'] || keys['a'] || keys['A'];
            const keyRight = keys['ArrowRight'] || keys['d'] || keys['D'];
            const keyJump = keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W'];

            updateGame(keyLeft, keyRight, keyJump);
            drawScene();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        loadLevelAndStart();
    }

    // --- CRITICAL FIX: Expose the function to the global scope ---
    window.startMarioGame = startMarioGame;

})(window);