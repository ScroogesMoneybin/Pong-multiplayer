// Canvas
const { body } = document;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

//by default, socket.io connects to socket server at same address
const socket = io('/pong');

let paddleIndex = 0;
const width = 500;
const height = 700;
const screenWidth = window.screen.width;
const canvasPosition = screenWidth / 2 - width / 2;
const isMobile = window.matchMedia('(max-width: 600px)');
const gameOverEl = document.createElement('div');

// Paddle
const paddleHeight = 10;
const paddleWidth = 50;
const paddleDiff = 25;
let paddleBottomX = 225;
let paddleTopX = 225;
let paddleX = [paddleBottomX, paddleTopX]
let playerMoved = false;
let paddleContact = false;

// Ball
let ballX = 250;
let ballY = 350;
const ballRadius = 5;

// Speed
let speedY;
let speedX;
let trajectoryX;


// Change Mobile Settings
if (isMobile.matches) {
  speedY = -2;
  speedX = speedY;
  
} else {
  speedY = -1;
  speedX = speedY;
  
}

// Score
let player1Score = 0;
let player2Score = 0;
let score = [player1Score, player2Score]
const winningScore = 11;
let isGameOver = true;
let isNewGame = true;

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = 'white';

  // Player Paddle (Bottom)
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Computer Paddle (Top)
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  // Score
  context.font = '32px Courier New';
  context.fillText(score[0], 20, canvas.height / 2 + 50);
  context.fillText(score[1], 20, canvas.height / 2 - 30);
}

// Create Canvas Element
function createCanvas() {
  canvas.width = width;
  canvas.height = height;
  body.appendChild(canvas);
  renderCanvas();
}

// Wait for Opponents
function renderIntro() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = 'white';
  context.font = "32px Courier New";
  context.fillText("Waiting for an opponent...", 20, (canvas.height / 2) - 30);
}


// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = -3;
  paddleContact = false;
  socket.emit('ballMove', {ballX, ballY, score, isGameOver})
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += -speedY;
  // Horizontal Speed
  if (playerMoved && paddleContact) {
    ballX += speedX;
  }
  socket.emit('ballMove', {ballX, ballY, score, isGameOver})
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX > paddleX[0] && ballX < paddleX[0] + paddleWidth) {
      paddleContact = true;
      // Add Speed on Hit
      if (playerMoved) {
        speedY -= 1;
        // Max Speed
        if (speedY < -5) {
          speedY = -5;
          
        }
      }
      speedY = -speedY;
      trajectoryX = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX * 0.3;
    } else if (ballY > height) {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX > paddleX[1] && ballX < paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      speedY = -speedY;
    } else if (ballY < 0) {
      // Reset Ball, add to Player Score
      ballReset();
      score[0]++;
    }
  }
}



function showGameOverEl(winner) {
  // Hide Canvas
  canvas.hidden = true;
  // Container
  gameOverEl.textContent = '';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = `${winner} Wins!`;
  // Button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.setAttribute('onclick', 'startGame()');
  playAgainBtn.textContent = 'Play Again';
  // Append
  gameOverEl.append(title, playAgainBtn);
  body.appendChild(gameOverEl);
  
}

// Check If One Player Has Winning Score, If They Do, End Game
function gameOver() {
  if (score[0] === winningScore || score[1] === winningScore) {
    isGameOver = true;
    // Set Winner
    let winner = score[0] === winningScore ? 'Player 1' : 'Player 2';
    showGameOverEl(winner);
  }
}

// Called Every Frame
function animate() {
  if (isReferee) {
    ballMove();
    ballBoundaries();
  }
  //re-render the canvas every frame
  renderCanvas();
 
  gameOver();
  if (!isGameOver) {
    window.requestAnimationFrame(animate);
  }
  
}

function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit('ready');
}

// Start Game, Reset Everything
function startGame() {
  paddleIndex = isReferee ? 0 : 1;
  if (isGameOver && !isNewGame) {
      body.removeChild(gameOverEl);
      canvas.hidden = false;

  }
  isGameOver = false;
  isNewGame = false;
  score[0] = 0;
  score[1] = 0;
  ballReset();
  
  animate();
  
  canvas.addEventListener('mousemove', (e) => {
    
    playerMoved = true;
    // Compensate for canvas being centered
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > width - paddleWidth) {
      paddleX[paddleIndex] = width - paddleWidth;
    }
    socket.emit('paddleMove', {
      xPosition: paddleX[paddleIndex],
    });
    // Hide Cursor
    canvas.style.cursor = 'none';
  });
}

// On Load

loadGame();

socket.on('connect',()=>{
  console.log('Connected as... ', socket.id)
})

socket.on('startGame', (refereeId)=> {
  console.log(`Referee is ${refereeId}`);
  isReferee = socket.id===refereeId;
  startGame();
});

socket.on('paddleMove', (paddleData) => {
  //switch 1 to 0 and 0 to 1
  const opponentPaddleIndex = 1 - paddleIndex;
  paddleX[opponentPaddleIndex] = paddleData.xPosition; 
});

socket.on('ballMove', (ballData) => {
  ({ballX, ballY, score, isGameOver} = ballData);
})