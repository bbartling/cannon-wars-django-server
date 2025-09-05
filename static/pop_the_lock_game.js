/**
 * Frontend logic for the Pop the Lock game.  This file glues the
 * compiled WebAssembly functions to a canvas-based game loop.  It
 * handles drawing the lock dial, reading angle state from the C code,
 * playing sound effects, tracking score and detecting hits.  When the
 * WASM module signals that the game is over, a simple overlay is
 * drawn and the player can click to restart.  Audio files are
 * preloaded in the HTML and are referenced by id.
 */

function startPopTheLockGame() {
  // Bind the C functions exported from the WASM module using cwrap.
  const setScreenSize = Module.cwrap('set_screen_size', 'void', ['number', 'number']);
  const tapEvent      = Module.cwrap('tap_event',      'void', []);
  const getBarAngle   = Module.cwrap('get_bar_angle',   'number', []);
  const getTargetAngle= Module.cwrap('get_target_angle','number', []);
  const isGameOverWasm= Module.cwrap('is_game_over',    'number', []);
  const resetGame     = Module.cwrap('reset_game',      'void', []);

  // Additional exported functions from the C module.  These may not
  // exist if the module was compiled without exporting _get_score and
  // _is_game_won.  In that case the variables will remain null and
  // fallback logic will be used.
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

  // Collect the 15 audio clips into an array.  The audio clips are
  // numbered 1–15 to signify increasing pitch.  They will be played
  // sequentially on each successful pop.
  const audioClips = [];
  for (let i = 1; i <= 15; i++) {
    const el = document.getElementById('popSound' + i);
    if (el) {
      audioClips.push(el);
    }
  }

  const winSound = document.getElementById('winSound');

  // Debug: report how many audio clips were loaded
  console.log(`[PopTheLock] Loaded ${audioClips.length} pop sound effects`);

  // Grab the canvas and 2D rendering context.
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Handle canvas resizing.  Pop the Lock uses a circular dial, so we
  // choose a radius relative to the smaller canvas dimension.  When
  // resized, we inform the WASM module of the new screen size.
  function resizeCanvas() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    setScreenSize(canvas.width, canvas.height);
    updateGeometry();
  }
  window.addEventListener('resize', resizeCanvas);

  // Compute geometry derived from the canvas size.
  let centerX, centerY, radius;
  function updateGeometry() {
    centerX = canvas.width  / 2;
    centerY = canvas.height / 2;
    // The dial radius is 35% of the smaller dimension to leave space for text.
    radius  = Math.min(canvas.width, canvas.height) * 0.35;
  }

  // Game state maintained on the JS side.  The WASM module tracks
  // internal angles and hit detection but does not expose a score.
  let score = 0;
  let gameOver = false;
  let gameWon = false;
  let audioIndex = 0;

  // Convert the difference between two angles into an absolute value
  // taking into account wrapping around 2π.  Returns a number in [0, π].
  function angularDifference(a, b) {
    let diff = Math.abs(a - b);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    return diff;
  }

  // Handle user clicks.  On a click we compute the angular difference
  // between the bar and target to decide whether the pop succeeded.  We
  // update the JS score independently from the WASM module.  The tap
  // event is always forwarded to the WASM to update its state.
  function onClick() {
    // Restart the game when clicking after game over or win.
    if (gameOver || gameWon) {
      console.log('[PopTheLock] Restarting game');
      resetGame();
      score = 0;
      audioIndex = 0;
      gameOver = false;
      gameWon = false;
      requestAnimationFrame(draw); // <-- ADD THIS LINE TO RESTART THE DRAW LOOP
      return;
    }
    if (typeof getScore === 'function') {
      // Use the score-based logic when getScore is available
      tapEvent(); // Ask WASM to process the tap first
      
      // Now, check the results from WASM
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
        // If the game is not over and not won, a tap must be either a miss or a success
        // We can check this by seeing if the audioIndex (our JS score tracker) matches the new score
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
      // Fallback logic when getScore is not available.  Compute the
      // angular difference on the JS side as a best effort.
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
      // In fallback we don't have a dedicated win flag; treat reaching
      // the maximum number of sounds as a win.
      if (score >= audioClips.length) {
        gameWon = true;
      }
    }
  }
  canvas.addEventListener('click', onClick);

  // Draw the dial, bar, target and score.  When the game ends an
  // overlay is drawn and the loop halts until a restart.
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer dial
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();

    // Read angles from WASM.  The call to getBarAngle() also
    // advances the internal timer inside the WASM module.
    const barAngle    = getBarAngle();
    const targetAngle = getTargetAngle();

    // Draw the target marker.  A slightly larger radius makes the
    // target easier to hit and stand out visually.
    const targetX = centerX + radius * Math.cos(targetAngle);
    const targetY = centerY + radius * Math.sin(targetAngle);
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius * 0.16, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700'; // gold
    ctx.fill();

    // Draw the rotating bar marker
    const barX = centerX + radius * Math.cos(barAngle);
    const barY = centerY + radius * Math.sin(barAngle);
    ctx.beginPath();
    ctx.arc(barX, barY, radius * 0.04, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF5555'; // red
    ctx.fill();

    // Score
    ctx.fillStyle = 'white';
    ctx.font = `${Math.floor(radius * 0.25)}px Arial`;
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 20, 20);

    // End‑of‑game overlays.  Show different messages for lose vs win.
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
      // Stop the loop until restart
      return;
    }
    requestAnimationFrame(draw);
  }

  // Initialise the game.  Resize canvas and geometry and reset the
  // underlying WASM state.  Start the draw loop.
  function init() {
    resizeCanvas();
    resetGame();
    console.log('[PopTheLock] Game state reset via resetGame()');
    // Kick off the render loop
    requestAnimationFrame(draw);
  }

  init();
}
