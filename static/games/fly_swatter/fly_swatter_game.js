function startFlySwatterGame() {
    const setScreenSize = Module.cwrap('set_screen_size', 'void', ['number', 'number']);
    const createFly = Module.cwrap('create_fly', 'void', []);
    const getNumFlies = Module.cwrap('get_num_flies', 'number', []);
    const getFlyX = Module.cwrap('get_fly_x', 'number', ['number']);
    const getFlyY = Module.cwrap('get_fly_y', 'number', ['number']);
    const isFlyAlive = Module.cwrap('is_fly_alive', 'number', ['number']);
    const attemptSwat = Module.cwrap('attempt_swat', 'void', ['number', 'number']);
    const getFlyAngle = Module.cwrap('get_fly_angle', 'number', ['number']);
    const updateFlies = Module.cwrap('update_flies', 'void', ['number', 'number']);
    const isFlyFlying = Module.cwrap('is_fly_flying', 'number', ['number']);
    
    const startingTime = 20;
    const swatSound = document.getElementById('swatSound');
    const flySound = document.getElementById('flySound');
    const winSound = document.getElementById('winSound');

    // Track whether we've already submitted a score to avoid multiple prompts
    let scoreSubmitted = false;
    /**
     * Validate a proposed leaderboard name. Only allow typical first names:
     * - 2 to 20 characters long
     * - Letters plus spaces, apostrophes or hyphens
     * This mirrors the server‑side validation logic.
     */
    function validateName(name) {
      if (!name) return false;
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 20) return false;
      return /^[A-Za-z][A-Za-z '\-]{1,19}$/.test(trimmed);
    }

    let canvas = document.getElementById('gameCanvas');
    let ctx = canvas.getContext('2d');
  
    let canvasW, canvasH;
    let mouseX = 0;
    let mouseY = 0;
    let mouseClicked = false;
    let flySoundStarted = false;
    let level = 1;
    let gameTime = Math.max(5, startingTime - (level - 1));
    let gameOver = false;
    let frameCount = 0;

    function drawFly(x, y, angle, isFlying) {
      if (!window.flyFrames || window.flyFrames.length < 2) {
        console.warn("Fly sprites not ready");
        return;
      }
    
      //const frameIndex = Math.floor(Date.now() / 150) % window.flyFrames.length;
      const frameIndex = isFlying ? Math.floor(Date.now() / 150) % window.flyFrames.length : 0;
      const img = window.flyFrames[frameIndex];
      const size = 40;
      const correction = 70 * Math.PI / 180;
    
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + correction);
      ctx.shadowColor = 'white';
      ctx.drawImage(img, -size / 2, -size / 2, size, size); 
      ctx.restore();
    }
    
    
    
    function init() {
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      canvasW = canvas.width;
      canvasH = canvas.height;
      setScreenSize(canvasW, canvasH);
      
      console.log("createFly() called in init");
      createFly(); // Create 1 fly
  
      window.addEventListener('resize', () => {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        canvasW = canvas.width;
        canvasH = canvas.height;
        setScreenSize(canvasW, canvasH);
      });
  
      canvas.addEventListener('mousedown', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        mouseClicked = true;
  
        if (!flySoundStarted) {
          flySound.currentTime = 0;
          flySound.play();
          flySoundStarted = true;
        }
  
        swatSound.currentTime = 0;
        swatSound.play();
      });
  
      setInterval(() => {
        if (!gameOver) {
          gameTime -= 1;
          if (gameTime <= 0) {
            gameOver = true;
            // Prompt for leaderboard name and submit score once when time expires
            if (!scoreSubmitted) {
              scoreSubmitted = true;
              try {
                const playerName = prompt("Time's up! Enter your first name for the leaderboard (2–20 letters/spaces/'/-):");
                
                // If user cancels the prompt, just navigate away
                if (playerName === null) {
                    window.location.href = "/fly_swatter_leaderboard";
                    return;
                }

                if (validateName(playerName)) {
                  fetch("/api/fly_leaderboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: playerName.trim(), score: level })
                  }).catch((err) => {
                      console.error("Error submitting score:", err);
                  }).finally(() => {
                    window.location.href = "/fly_swatter_leaderboard";
                  });
                } else {
                  // User entered an invalid name but didn't cancel
                  alert("Invalid name format. Please use 2-20 letters, spaces, apostrophes, or hyphens.");
                  window.location.href = "/fly_swatter_leaderboard";
                }
              } catch (e) {
                console.error(e);
                window.location.href = "/fly_swatter_leaderboard";
              }
            }
            flySound.pause();
            flySound.currentTime = 0;
            winSound.pause();
            swatSound.pause();
          }
        }
      }, 1000);
  
      requestAnimationFrame(gameLoop);
    }
  
    let now = performance.now();
    let lastTime = now;
    
    function gameLoop() {
      let currentTime = performance.now();
      let delta = (currentTime - lastTime) / 1000; // in seconds
      lastTime = currentTime;
    
      ctx.clearRect(0, 0, canvasW, canvasH);
    
      if (!gameOver) {
        updateFlies(delta, gameTime);
      }
    
      let numFlies = getNumFlies();
      let anyFlyFlying = false;
    
      for (let i = 0; i < numFlies; i++) {
        if (isFlyAlive(i)) {
          let x = getFlyX(i);
          let y = getFlyY(i);
          let angle = getFlyAngle(i);
          const flying = isFlyFlying(i);
    
          if (flying) {
            anyFlyFlying = true;
          }
    
          drawFly(x, y, angle, flying);
        }
      }
    
      // Fly buzzing sound control
      if (anyFlyFlying && !flySoundStarted) {
        flySound.play();
        flySoundStarted = true;
      } else if (!anyFlyFlying && flySoundStarted) {
        flySound.pause();
        flySoundStarted = false;
      }
    
      if (frameCount++ % 60 === 0) {
        console.log(`🌀 Level ${level}, alive flies: ${numFlies}`);
      }
    
      if (mouseClicked) {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fill();
        ctx.closePath();
    
        attemptSwat(mouseX, mouseY);
    
        let allDead = true;
        for (let i = 0; i < numFlies; i++) {
          if (isFlyAlive(i)) {
            allDead = false;
            break;
          }
        }
    
        if (allDead) {
          winSound.currentTime = 0;
          winSound.play();
          level += 1;
          gameTime = Math.max(5, startingTime - (level - 1));
          for (let i = 0; i < level; i++) {
            createFly();
          }
        }
    
        mouseClicked = false;
      }
    
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.fillText('Time Left: ' + gameTime, 20, 40);
      ctx.fillText('Level: ' + level, 20, 70);
    
      if (gameOver) {
        ctx.fillStyle = 'yellow';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over!', canvasW / 2 - 100, canvasH / 2);
      } else {
        requestAnimationFrame(gameLoop);
      }
    }    
  
    init();
    window.startFlySwatterGame = startFlySwatterGame;
    
  }

