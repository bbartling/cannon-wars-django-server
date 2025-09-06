

function startPopTheLockGame() {
  const setScreenSize = Module.cwrap('set_screen_size', 'void', ['number', 'number']);
  const tapEvent      = Module.cwrap('tap_event',      'void', []);
  const getBarAngle   = Module.cwrap('get_bar_angle',   'number', []);
  const getTargetAngle= Module.cwrap('get_target_angle','number', []);
  const isGameOverWasm= Module.cwrap('is_game_over',    'number', []);
  const resetGame     = Module.cwrap('reset_game',      'void', []);

  let getScore = null;
  let isGameWonWasm = null;
  try {
    if (Module['_get_score']) {
      getScore = Module.cwrap('get_score', 'number', []);
    }
  } catch (e) {
    getScore = null;
  }
  try {
    if (Module['_is_game_won']) {
      isGameWonWasm = Module.cwrap('is_game_won', 'number', []);
    }
  } catch (e) {
    isGameWonWasm = null;
  }

  const audioClips = [];
  for (let i = 1; i <= 15; i++) {
    const el = document.getElementById('popSound' + i);
    if (el) {
      audioClips.push(el);
    }
  }

  const winSound = document.getElementById('winSound');
  console.log(`[PopTheLock] Loaded ${audioClips.length} pop sound effects`);

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    setScreenSize(canvas.width, canvas.height);
    updateGeometry();
  }
  window.addEventListener('resize', resizeCanvas);

  let centerX, centerY, radius;
  function updateGeometry() {
    centerX = canvas.width  / 2;
    centerY = canvas.height / 2;
    radius  = Math.min(canvas.width, canvas.height) * 0.35;
  }

  let score = 0;
  let gameOver = false;
  let gameWon = false;
  let audioIndex = 0;

  function onClick() {
    if (gameOver || gameWon) {
      console.log('[PopTheLock] Restarting game');
      resetGame();
      score = 0;
      audioIndex = 0;
      gameOver = false;
      gameWon = false;
      requestAnimationFrame(draw);
      return;
    }
    if (typeof getScore === 'function') {
      tapEvent(); // Ask WASM to process the tap first
      score = getScore(); // Update JS score

      if (isGameOverWasm() === 1) {
        console.log('[PopTheLock] Game over detected from WASM');
        gameOver = true;
      } else if (typeof isGameWonWasm === 'function' && isGameWonWasm() === 1) {
        console.log('[PopTheLock] Game won detected from WASM');
        gameWon = true;
        if (winSound) {
          winSound.currentTime = 0;
          winSound.play();
        }
      } else {

        if (audioIndex < score) {
            audioIndex = score;
            const clipIndex = Math.min(score - 1, audioClips.length - 1);
            const clip = audioClips[clipIndex];
            if (clip) {
                console.log(`[PopTheLock] Successful pop! Score=${score}, playing sound #${clipIndex + 1}`);
                clip.currentTime = 0;
                clip.play();
            }
        } else {
             console.log('[PopTheLock] Missed pop');
        }
      }
    } else {

      const barAngle    = getBarAngle();
      const targetAngle = getTargetAngle();
      let diff = Math.abs(barAngle - targetAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      const tolerance = 0.15;
      if (diff < tolerance) {
        score++;
        const clipIndex = Math.min(score - 1, audioClips.length - 1);
        const clip = audioClips[clipIndex];
        if (clip) {
          console.log(`[PopTheLock] Successful pop! (fallback) Score=${score}, playing sound #${clipIndex + 1}`);
          clip.currentTime = 0;
          clip.play();
        }
      } else {
        console.log('[PopTheLock] Missed pop (fallback)');
      }
      tapEvent();
      if (isGameOverWasm() === 1) {
        console.log('[PopTheLock] Game over detected from WASM');
        gameOver = true;
      }

      if (score >= audioClips.length) {
        gameWon = true;
      }
    }
  }
  canvas.addEventListener('click', onClick);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer dial
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();

    const barAngle    = getBarAngle();
    const targetAngle = getTargetAngle();
    const targetX = centerX + radius * Math.cos(targetAngle);
    const targetY = centerY + radius * Math.sin(targetAngle);

    ctx.beginPath();
    ctx.arc(targetX, targetY, radius * 0.16, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700'; // gold
    ctx.fill();

    const barX = centerX + radius * Math.cos(barAngle);
    const barY = centerY + radius * Math.sin(barAngle);
    ctx.beginPath();
    ctx.arc(barX, barY, radius * 0.04, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF5555'; // red
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = `${Math.floor(radius * 0.25)}px Arial`;
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 20, 20);

    if (gameOver || gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      if (gameWon) {
        ctx.font = `${Math.floor(radius * 0.5)}px Arial`;
        ctx.fillText('You Win!', centerX, centerY - radius * 0.2);
        ctx.font = `${Math.floor(radius * 0.3)}px Arial`;
        ctx.fillText('Final Score: ' + score, centerX, centerY + radius * 0.1);
      } else {
        ctx.font = `${Math.floor(radius * 0.5)}px Arial`;
        ctx.fillText('Game Over!', centerX, centerY - radius * 0.2);
        ctx.font = `${Math.floor(radius * 0.3)}px Arial`;
        ctx.fillText('Final Score: ' + score, centerX, centerY + radius * 0.1);
      }
      ctx.font = `${Math.floor(radius * 0.18)}px Arial`;
      ctx.fillText('Click to restart', centerX, centerY + radius * 0.4);
      ctx.textAlign = 'left';
      return;
    }
    requestAnimationFrame(draw);
  }

  function init() {
    resizeCanvas();
    resetGame();
    console.log('[PopTheLock] Game state reset via resetGame()');
    requestAnimationFrame(draw);
  }

  init();
}
