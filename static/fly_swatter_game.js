function startFlySwatterGame() {
    const setScreenSize = Module.cwrap('set_screen_size', 'void', ['number', 'number']);
    const createFly = Module.cwrap('create_fly', 'void', []);
    const updateFlies = Module.cwrap('update_flies', 'void', []);
    const getNumFlies = Module.cwrap('get_num_flies', 'number', []);
    const getFlyX = Module.cwrap('get_fly_x', 'number', ['number']);
    const getFlyY = Module.cwrap('get_fly_y', 'number', ['number']);
    const isFlyAlive = Module.cwrap('is_fly_alive', 'number', ['number']);
    const attemptSwat = Module.cwrap('attempt_swat', 'void', ['number', 'number']);
  
    const startingTime = 20;
    const swatSound = document.getElementById('swatSound');
    const flySound = document.getElementById('flySound');
    const winSound = document.getElementById('winSound');

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

    function drawFly(x, y) {
      const frameWidth = 256;
      const frameHeight = 241;
      const totalFrames = 5;
      const scale = 0.2;
      const animationSpeed = 100;
    
      const currentFrame = Math.floor(Date.now() / animationSpeed) % totalFrames;
    
      ctx.drawImage(
        flySprite,
        currentFrame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        x - (frameWidth * scale) / 2,
        y - (frameHeight * scale) / 2,
        frameWidth * scale,
        frameHeight * scale
      );
    }    
  
    function init() {
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      canvasW = canvas.width;
      canvasH = canvas.height;
      setScreenSize(canvasW, canvasH);
  
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
            flySound.pause();
            flySound.currentTime = 0;
            winSound.pause();
            swatSound.pause();
          }
        }
      }, 1000);
  
      requestAnimationFrame(gameLoop);
    }
  
    function gameLoop() {
      ctx.clearRect(0, 0, canvasW, canvasH);
  
      if (!gameOver) {
        updateFlies();
      }
  
      let numFlies = getNumFlies();
      console.log(` Drawing flies for level ${level} - total alive: ${numFlies}`);
      
      for (let i = 0; i < numFlies; i++) {
        let alive = isFlyAlive(i);
        if (alive) {
          let x = getFlyX(i);
          let y = getFlyY(i);
          drawFly(x, y);
        }
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
        ctx.fillText('Game Over!', canvasW/2 - 100, canvasH/2);
      } else {
        requestAnimationFrame(gameLoop);
      }
    }
  
    init();
    window.startFlySwatterGame = startFlySwatterGame;
    
  }
  