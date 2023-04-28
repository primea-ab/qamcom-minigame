const counter = { score: 0 };
const counterRef = document.getElementById('counter');
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 15;
const paddleHeight = grid * 5; // 80
const maxPaddleY = canvas.height - grid - paddleHeight;
let health;
let canvasId;
let gameStarted = false;
const MAIL_VALIDATION_REGEX = /.+@.+\..+/;

let paddleSpeed = 0.5;
let ballSpeed = 0.5;
const HIDE = 'display: none';
const SHOW = '';

const onCheckboxPressed = () => {
  document.getElementById('submit-button').disabled = !checkbox.checked;
}

const checkbox = document.getElementById('consent-checkbox');
checkbox.addEventListener('click', onCheckboxPressed);

let wantedPosition = 0;

const submit = async () => {
  const name = document.getElementById('name-input').value;
  const email = document.getElementById('email-input').value;

  if(!MAIL_VALIDATION_REGEX.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  const res = await fetch('https://pong.fly.dev/submit', { method: 'POST', body: JSON.stringify({ email, name, score: counter.score })})
  const data = await res.json();
  const parent = document.getElementById('scoreboard-list');
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  data.forEach(user => {
    let elem = document.createElement('li');
    elem.textContent = `${user.name} - ${user.score} points`;
    document.getElementById('scoreboard-list').appendChild(elem);
  })
  document.getElementById('info-text').innerText = 'Registered!';
  document.getElementById('info-text').style = 'color: green; font-weight: bold; font-size: 18px';
  document.getElementById('submit-button').disabled = true;
}

const play = () => {
  canvasId = requestAnimationFrame(loop);
  document.getElementById('start-game').style = SHOW;
  document.getElementById('score-section').style = SHOW;
  document.getElementById('count-down').style = SHOW;
  document.getElementById('count-down').style = SHOW;
  document.getElementById('scoreboard').style = HIDE;
  document.getElementById('start-button').style = HIDE;
  let countDown = 3;
  health = 2;
  document.getElementById('count-down').innerHTML = countDown;

  const countdownInterval = setInterval(() => {
    countDown--;
    document.getElementById('count-down').innerHTML = countDown;
    if (countDown < 0) {
      document.getElementById('count-down').style = HIDE;
      gameStarted = true;
      clearInterval(countdownInterval);
    }
  }, 1000);

  const speedInterval = setInterval(() => {
    paddleSpeed *= 1.1;
    ball.dx *= 1.1;
    ball.dy *= 1.1;
    if (paddleSpeed >= 1.5) {
      clearInterval(speedInterval);
    }
  }, 5000);
}

const leftPaddle = {
  // start in the middle of the game on the left side
  x: grid * 2,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,

  // paddle velocity
  dy: 0
};
const rightPaddle = {
  // start in the middle of the game on the right side
  x: canvas.width - grid * 3,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,

  // paddle velocity
  dy: 0
};
const ball = {
  // start in the middle of the game
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: grid,
  height: grid,

  // keep track of when need to reset the ball position
  resetting: false,

  // ball velocity (start going to the top-right corner)
  dx: -ballSpeed,
  dy: -ballSpeed
};

// check for collision between two objects using axis-aligned bounding box (AABB)
// @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
const collides = (obj1, obj2) => {
  return obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y;
}

let previousTimeStamp;

// game loop
const loop = (timestamp) => {
  if (previousTimeStamp === undefined) {
    previousTimeStamp = timestamp;
  }

  const elapsed = timestamp - previousTimeStamp;

  if (elapsed !== 0) {
    context.clearRect(0,0,canvas.width,canvas.height);

    if (leftPaddle.y > ball.y) {
      leftPaddle.dy = -paddleSpeed * 1.5;
    } else {
      leftPaddle.dy = paddleSpeed * 1.5;
    }

    // move paddles by their velocity
    leftPaddle.y += leftPaddle.dy * elapsed;

    if (rightPaddle.y <= wantedPosition && rightPaddle.y + rightPaddle.dy * elapsed >= wantedPosition) {
      rightPaddle.y = wantedPosition;
    } else if (rightPaddle.y >= wantedPosition && rightPaddle.y + rightPaddle.dy * elapsed <= wantedPosition) {
      rightPaddle.y = wantedPosition;
    } else {
      rightPaddle.y += rightPaddle.dy * elapsed;
    }

    // prevent paddles from going through walls
    if (leftPaddle.y < grid) {
      leftPaddle.y = grid;
    }
    else if (leftPaddle.y > maxPaddleY) {
      leftPaddle.y = maxPaddleY;
    }

    if (rightPaddle.y > wantedPosition) {
      rightPaddle.dy = -paddleSpeed;
    } else if (rightPaddle.y < wantedPosition) {
      rightPaddle.dy = paddleSpeed;
    }

    if (rightPaddle.y < grid) {
      rightPaddle.y = grid;
    }
    else if (rightPaddle.y > maxPaddleY) {
      rightPaddle.y = maxPaddleY;
    }

    // draw paddles
    context.fillStyle = 'white';
    context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // move ball by its velocity
    if (gameStarted) {
      ball.x += ball.dx * elapsed;
      ball.y += ball.dy * elapsed;
    }

    // prevent ball from going through walls by changing its velocity
    if (ball.y < grid) {
      ball.y = grid;
      ball.dy *= -1;
    }
    else if (ball.y + grid > canvas.height - grid) {
      ball.y = canvas.height - grid * 2;
      ball.dy *= -1;
    }

    // reset ball if it goes past paddle (but only if we haven't already done so)
    if ( (ball.x < 0 || ball.x > canvas.width) && !ball.resetting) {
      ball.resetting = true;

      // give some time for the player to recover before launching the ball again
      setTimeout(() => {
        //counter.score = 0;
        //counterRef.innerHTML = 0;
        health -= 1;
        if (health === 1) {
          document.getElementById('health-2').style = HIDE;
        } else if (health === 0) {
          fetch('https://pong.fly.dev/scoreboard').then(async (res) => {
            const data = await res.json();
            if (data.length === 0) {
              let elem = document.createElement('p');
              elem.textContent = 'No one on the scoreboard yet. Be the first to join!';
              elem.classList.add('no-scoreboard');
              document.getElementById('scoreboard-list').appendChild(elem);
              document.getElementById('scoreboard-list').classList.remove('two-column-list');
            } else {
              data.forEach(user => {
                let elem = document.createElement('li');
                elem.textContent = `${user.name} - ${user.score} points`;
                document.getElementById('scoreboard-list').appendChild(elem);
              })
            }
            document.getElementById('start-game').style = HIDE;
            document.getElementById('logo').style = HIDE;
            document.getElementById('scoreboard').style = SHOW;
          })
          cancelAnimationFrame(canvasId);
          return;
        }

        ball.resetting = false;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        //send the ball away from the player when restarting
        ball.dx = -ball.dx;
      }, 400);
    }

    // check to see if ball collides with paddle. if they do change x velocity
    if (collides(ball, leftPaddle)) {
      ball.dx *= -1;

      // move ball next to the paddle otherwise the collision will happen again
      // in the next frame
      ball.x = leftPaddle.x + leftPaddle.width;
    }
    else if (collides(ball, rightPaddle)) {
      counter.score += 1;
      counterRef.innerHTML = counter.score;
      ball.dx *= -1;

      // move ball next to the paddle otherwise the collision will happen again
      // in the next frame
      ball.x = rightPaddle.x - ball.width;
    }

    // draw ball
    context.fillStyle = 'white';
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    // draw walls
    context.fillStyle = 'lightgrey';
    context.fillRect(0, 0, canvas.width, grid);
    context.fillRect(0, canvas.height - grid, canvas.width, canvas.height);

    // draw dotted line down the middle
    for (let i = grid; i < canvas.height - grid; i += grid * 2) {
      context.fillRect(canvas.width / 2 - grid / 2, i, grid/4, grid);
    }
  }
  
  previousTimeStamp = timestamp;
  requestAnimationFrame(loop);
}

addEventListener("touchmove", (event) => {
  event.preventDefault();
});

addEventListener("pointermove", (event) => {
  const game = document.getElementById('game')
  wantedPosition = event.y - game.offsetTop - (paddleHeight / 2);
  //document.getElementById('pos').innerHTML = rightPaddle.dy + ' ' + wantedPosition
});

addEventListener("pointerdown", (event) => {
  const game = document.getElementById('game')
  wantedPosition = event.y - game.offsetTop - (paddleHeight / 2);
  //document.getElementById('pos').innerHTML = rightPaddle.dy + ' ' + wantedPosition
});

// listen to keyboard events to move the paddles
document.addEventListener('keydown', (e) => {
  // up arrow key
  if (e.which === 38) {
    rightPaddle.dy = -paddleSpeed;
  }
  // down arrow key
  else if (e.which === 40) {
    rightPaddle.dy = paddleSpeed;
  }
});

// listen to keyboard events to stop the paddle if key is released
document.addEventListener('keyup', (e) => {
  if (e.which === 38 || e.which === 40) {
    rightPaddle.dy = 0;
  }
});
