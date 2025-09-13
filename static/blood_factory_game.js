/*
 * Main JavaScript for the Blood Factory game. This file wires up
 * the WebAssembly (or fallback) module with a canvas, keyboard
 * controls, and simple drawing. This version includes a camera
 * system for "Zelda-like" gameplay and extensive console logging
 * for debugging.
 */
console.log('🩸 Blood Factory JS loaded.');

// Immediately set up fallback C function implementations if no Wasm
// module was loaded.
(function() {
  if (typeof Module === 'undefined') {
    Module = {};
  }
  if (typeof Module.set_screen_size === 'undefined') {
    // This fallback is now significantly more complex to mirror the C logic
    console.log('⚠️ Using JavaScript fallback implementations. WASM module not found.');
    // States must match C enums
    const PlayerState = { IDLE: 0, RUNNING: 1, ATTACKING: 2, HIT: 3, DEAD: 4 };
    const EnemyState = { WANDERING: 0, IDLE: 1, CHASING: 2, ATTACKING: 3, HIT: 4, DYING: 5 };

    const state = {
      screenWidth: 800,
      screenHeight: 600,
      player: { x: 400, y: 300, health: 100, state: PlayerState.IDLE, animation_timer: 0 },
      enemies: [],
      gameOver: false,
      player_moved_this_frame: false
    };

    Module.set_screen_size = (w, h) => { state.screenWidth = w; state.screenHeight = h; };
    Module.init_game = () => {
        state.player = { x: state.screenWidth / 2, y: state.screenHeight / 2, health: 100, state: PlayerState.IDLE, animation_timer: 0 };
        state.enemies = [{
            x: state.screenWidth / 2 + 150, y: state.screenHeight / 2, health: 50, state: EnemyState.IDLE,
            state_timer: 2.0, attack_cooldown: 0, vx: 0, vy: 0
        }];
        state.gameOver = false;
    };
    // NOTE: This is a simplified mirror of the C logic and may not be perfect.
    Module.update_game = (dt) => { /* Complex AI and state logic would go here */ };
    Module.move_player = (dx, dy) => {
        if (state.player.animation_timer > 0) return;
        state.player.x += dx;
        state.player.y += dy;
        state.player.state = PlayerState.RUNNING;
        state.player_moved_this_frame = true;
    };
    Module.player_attack = () => {
        if (state.player.animation_timer > 0) return;
        state.player.state = PlayerState.ATTACKING;
        state.player.animation_timer = 0.6;
    };
    Module.get_player_x = () => state.player.x;
    Module.get_player_y = () => state.player.y;
    Module.get_player_state = () => state.player.state;
    Module.get_player_health = () => state.player.health;
    Module.get_num_enemies = () => state.enemies.length;
    Module.get_enemy_x = (i) => state.enemies[i]?.x ?? -1;
    Module.get_enemy_y = (i) => state.enemies[i]?.y ?? -1;
    Module.get_enemy_state = (i) => state.enemies[i]?.state ?? -1;
    Module.is_enemy_alive = (i) => (state.enemies[i]?.health ?? 0) > 0;
    Module.is_game_over = () => state.gameOver;
    Module.get_score = () => (state.enemies[0]?.health <= 0) ? 50 : 0;
  }
})();

function startBloodFactoryGame() {
  console.log('🚀 Initializing Blood Factory game...');
  // --- UPDATED: Acquire all wrapped C functions ---
  const setScreenSize   = Module.cwrap('set_screen_size', 'void', ['number', 'number']);
  const initGame        = Module.cwrap('init_game', 'void', []);
  const updateGame      = Module.cwrap('update_game', 'void', ['number']);
  const movePlayer      = Module.cwrap('move_player', 'void', ['number', 'number']);
  const playerAttack    = Module.cwrap('player_attack', 'void', []);
  const getPlayerX      = Module.cwrap('get_player_x', 'number', []);
  const getPlayerY      = Module.cwrap('get_player_y', 'number', []);
  const getPlayerState  = Module.cwrap('get_player_state', 'number', []);
  const getPlayerHealth = Module.cwrap('get_player_health', 'number', []);
  const getNumEnemies   = Module.cwrap('get_num_enemies', 'number', []);
  const getEnemyX       = Module.cwrap('get_enemy_x', 'number', ['number']);
  const getEnemyY       = Module.cwrap('get_enemy_y', 'number', ['number']);
  const getEnemyState   = Module.cwrap('get_enemy_state', 'number', ['number']);
  const isEnemyAlive    = Module.cwrap('is_enemy_alive', 'number', ['number']);
  const isGameOverWasm  = Module.cwrap('is_game_over', 'number', []);
  const getScore        = Module.cwrap('get_score', 'number', []);

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // --- UPDATED: Load ALL animation assets ---
  console.log('🖼️ Loading all animation assets...');
  const assets = {
      map: new Image(),
      player: {
          idle:   { img: new Image(), frames: 10 },
          run:    { img: new Image(), frames: 10 },
          attack: { img: new Image(), frames: 9 },
          hit:    { img: new Image(), frames: 4 },
          death:  { img: new Image(), frames: 16 }
      },
      skeleton: {
          idle:   { img: new Image(), frames: 5 },
          run:    { img: new Image(), frames: 6 },
          attack: { img: new Image(), frames: 8 },
          hit:    { img: new Image(), frames: 4 },
          death:  { img: new Image(), frames: 18 }
      }
  };
  assets.map.src = '/static/blood_map.png';
  assets.player.idle.img.src = '/static/Blood-Vladimir-Idle.png';
  assets.player.run.img.src = '/static/Blood-Vladimir-Run.png';
  assets.player.attack.img.src = '/static/Blood-Vladimir-Attack.png';
  assets.player.hit.img.src = '/static/Blood-Vladimir-Hit.png';
  assets.player.death.img.src = '/static/Blood-Vladimir-Death.png';
  assets.skeleton.idle.img.src = '/static/Blood-Skeleton-Idle.png';
  assets.skeleton.run.img.src = '/static/Blood-Skeleton-Run.png';
  assets.skeleton.attack.img.src = '/static/Blood-Skeleton-Attack.png';
  assets.skeleton.hit.img.src = '/static/Blood-Skeleton-Hit.png';
  assets.skeleton.death.img.src = '/static/Blood-Skeleton-Death.png';

  let imagesToLoad = 11;
  let imagesLoaded = 0;
  function onAssetLoaded() {
      imagesLoaded++;
      console.log(`🖼️ Asset loaded (${imagesLoaded}/${imagesToLoad}).`);
      if (imagesLoaded === imagesToLoad) {
          console.log('✅ All assets loaded.');
          startGame();
      }
  }
  const allImages = [
      assets.map, assets.player.idle.img, assets.player.run.img, assets.player.attack.img,
      assets.player.hit.img, assets.player.death.img, assets.skeleton.idle.img, assets.skeleton.run.img,
      assets.skeleton.attack.img, assets.skeleton.hit.img, assets.skeleton.death.img
  ];
  allImages.forEach(img => img.onload = onAssetLoaded);

  let gameWidth, gameHeight;
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    console.log(`📐 Resizing canvas to ${gameWidth}x${gameHeight}.`);
    setScreenSize(gameWidth, gameHeight);
  }
  window.addEventListener('resize', resizeCanvas);

  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
      e.preventDefault();
      playerAttack();
    } else if (e.key.toLowerCase() === 'r') {
      console.log('🔄 Player restarting game.');
      initGame();
      frameCounters = {};
      scoreSubmitted = false;
    }
  });
  document.addEventListener('keyup', (e) => { keys[e.key] = false; });

  let scoreSubmitted = false;
  function submitScore() { /* ... same as your previous code ... */ }

  function startGame() {
    console.log('▶️ Starting game loop...');
    resizeCanvas();
    initGame();
    let lastTime = performance.now();
    function gameLoop(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      let dx = 0;
      let dy = 0;
      const speed = 200;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= speed * dt;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += speed * dt;
      if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= speed * dt;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += speed * dt;
      if (dx !== 0 || dy !== 0) movePlayer(dx, dy);
      
      updateGame(dt);
      drawScene();

      if (isGameOverWasm() === 1 && !scoreSubmitted) {
          scoreSubmitted = true;
          // You might want a delay before showing the prompt
          setTimeout(submitScore, 2000); // e.g., wait 2 seconds after death
      }
      requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
  }

  // --- UPDATED: Animation function handles non-looping animations ---
  let frameCounters = {};
  function drawAnimatedSprite(entityId, sprite, worldX, worldY, isLooping = true) {
      const frameW = sprite.img.width / sprite.frames;
      const frameH = sprite.img.height;
      if (!frameCounters[entityId]) frameCounters[entityId] = { frame: 0, lastSprite: null };
      if (frameCounters[entityId].lastSprite !== sprite) {
          frameCounters[entityId].frame = 0;
          frameCounters[entityId].lastSprite = sprite;
      }
      let currentFrame = Math.floor(frameCounters[entityId].frame);
      if (!isLooping) {
          currentFrame = Math.min(currentFrame, sprite.frames - 1);
      } else {
          currentFrame %= sprite.frames;
      }
      ctx.drawImage(
          sprite.img,
          currentFrame * frameW, 0, frameW, frameH,
          worldX - frameW / 2, worldY - frameH / 2, frameW, frameH
      );
      frameCounters[entityId].frame += 0.25; // Animation speed
  }

  // --- UPDATED: Draw function handles all new states ---
  function drawScene() {
    const playerX = getPlayerX();
    const playerY = getPlayerY();
    let cameraX = playerX - gameWidth / 2;
    let cameraY = playerY - gameHeight / 2;
    if (cameraX < 0) cameraX = 0; if (cameraY < 0) cameraY = 0;
    if (cameraX > 0) cameraX = 0; if (cameraY > 0) cameraY = 0;

    ctx.clearRect(0, 0, gameWidth, gameHeight);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Inside the drawScene function
    ctx.drawImage(assets.map, 0, 0, gameWidth, gameHeight);

    // Draw Player with full state machine
    const playerState = getPlayerState();
    let playerSprite, pLoop = true;
    switch (playerState) {
        case 1: pSprite = assets.player.run; break;
        case 2: pSprite = assets.player.attack; pLoop = false; break;
        case 3: pSprite = assets.player.hit; pLoop = false; break;
        case 4: pSprite = assets.player.death; pLoop = false; break;
        default: pSprite = assets.player.idle; break;
    }
    drawAnimatedSprite('player', pSprite, playerX, playerY, pLoop);

    // Draw Skeleton with full state machine
    const enemyState = getEnemyState(0);
    let eSprite, eLoop = true;
    switch (enemyState) {
        case 1: eSprite = assets.skeleton.idle; break;
        case 2: eSprite = assets.skeleton.run; break; // Chasing
        case 3: eSprite = assets.skeleton.attack; eLoop = false; break;
        case 4: eSprite = assets.skeleton.hit; eLoop = false; break;
        case 5: eSprite = assets.skeleton.death; eLoop = false; break;
        default: eSprite = assets.skeleton.run; break; // Wandering
    }
    drawAnimatedSprite('enemy0', eSprite, getEnemyX(0), getEnemyY(0), eLoop);
    
    ctx.restore();

    // Draw UI Health Bar
    const playerHealth = getPlayerHealth();
    const maxHealth = 100;
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 204, 24);
    ctx.fillStyle = 'red';
    ctx.fillRect(12, 12, 200, 20);
    ctx.fillStyle = 'green';
    ctx.fillRect(12, 12, (playerHealth / maxHealth) * 200, 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`HP: ${playerHealth} / ${maxHealth}`, 14, 28);
  }

  if (typeof Module !== 'undefined' && typeof Module.onRuntimeInitialized === 'function') {
    if (!Module._bfStarted) {
      Module._bfStarted = true;
      Module.onRuntimeInitialized();
    }
  }
}