const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10}];
const INITIAL_DIRECTION = { x:1, y:0 };
const INITIAL_FOOD = { x: 15, y: 15};
const TARGET_SCORE = 200;
const CAREFUL_THRESHOLD = 100;

const DIFFICULTY_SETTINGS = {
    easy: {
        makeRandomMove: 0.4,
        pathToFoodWeight: 600,
        floodFillWeight: 2,
        specialFoodWeight: 0.7,
        carefulnessMultiplier: 0.5,
        gameLoopInterval: 150
    },
    medium: {
        makeRandomMove: 0.15,
        pathToFoodWeight: 1000,
        floodFillWeight: 5,
        specialFoodWeight: 1,
        carefulnessMultiplier: 0.8,
        gameLoopInterval: 100
    },
    hard: {
        makeRandomMove: 0.02,
        pathToFoodWeight: 1500,
        floodFillWeight: 10,
        specialFoodWeight: 1.2,
        carefulnessMultiplier: 1,
        gameLoopInterval: 80
    }
};


let snake = [...INITIAL_SNAKE];
let direction = {...INITIAL_DIRECTION};
let food = {...INITIAL_FOOD};
let gameOver = false;
let score = 0;
let movesSinceLastFood = 0;
let specialFood = null;
let difficulty = 'medium';
let gameStarted = false;
let gameLoopId = null;
let seed = Date.now();

//This allows for the game randomness to work the same across different browsers
function customRandom() {
    seed = (1103515245 * seed + 1234) % 2147483647;
    return seed / 2147483647;
}

//This helps when the snake wants to teleport through walls
function mod(n,m) {
    return ((n % m) + m) % m;
}

function isSamePoint(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

function isCollision(point, snk = snake) {
    return snk.some(segment => isSamePoint(segment, point));
}

function getNextHead(dir, head = snake[0]) {
    return {
        x: mod(head.x + dir.x, GRID_SIZE),
        y: mod(head,y + dir.y, GRID_SIZE)
    };
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(customRandom() * GRID_SIZE),
            y: Math.floor(customRandom() * GRID_SIZE)
        };
    }while (isCollision(newFood));
    food = newFood;
}

function generateSpecialFood() {
    if (customRandom() < 0.05) {
        let newSpecialFood;
        do {
            newSpecialFood = {
                x: Math.floor(customRandom() * GRID_SIZE),
                y: Math.floor(customRandom() * GRID_SIZE),
                type: customRandom() < 0.7 ? 'score' : 'speed'
            };
        } while (isCollision(newSpecialFood) || 
                (food.x === newSpecialFood.x && food.y === newSpecialFood.y));
                specialFood = newSpecialFood;
    } else {
        specialFood = null;
    }
}

function getAvailableDirections(head = snake[0]) {
    const directions = [
        { x: 1, y:0 }, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
    ];
    return directions.filter(dir => {
        const nextHead = getNextHead(dir, head);
        return !isCollision(nextHead, snake.slice(0, -1));
    });
}

function findPath(start, goal, snk) {
    const queue = [[start]];
    const visited = new Set();

    while (queue.length > 0) {
        const path = queue.shift()
        const current = path[path.length - 1];

        if (current.x === goal.x && current.y === goal.y) {
            return path;
        }

        const directions = [
            {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1} 
        ];

        for(const dir of directions) {
            const next = getNextHead(dir, current);
            const key = `${next.x},${next.y}`;

            if (!visited.has(key) && !isCollision(next, snk)) {
                visited.add(key);
                queue.push([...path, next]);
            }
        }
    }
    return null;
}

function floodFill(start, obstacles) {
    const queue = [start];
    const visited = new Set();
    const isValidCell = (x,y) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);

        const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            if (isValidCell(newX, newY) &&
                !obstacles.some(obs => obs.x === newX && obs.y === newY)) {
                    queue.push({ x: newX, y: newY });
                }
        }
    }
    return visited.site
}

function evaluateMove(dir, head, snk, foodPos, currentScore) {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const nextHead = getNextHead(dir, head);

    if (isCollision(nextHead, snk.slice(0, -1))) return -Infinity;

    let score = 0;

    const pathToFood = findPath(nextHead, foodPos, snk);
    if (pathToFood) {
        score += settings.pathToFoodWeight - pathToFood.length * 10;
    } else {
        score -= 500;
    }


    const floodFillScore = floodFill(nextHead, [...snk.slice(0,-1), nextHead]);
    score += floodFillScore * settings.floodFillWeight;

    if (specialFood) {
        const pathToSpecialFood = findPath(nextHead, specialFood, snk);
        if (pathToSpecialFood) {
            const specialFoodScore = specialFood.type === 'score' ? 300: 200;
            score += specialFoodScore * settings.specialFoodWeight - pathToSpecialFood.length * 5;
        }
    }

    if (currentScore >= CAREFUL_THRESHOLD) {
        const carefulness = Math.min((currentScore - CAREFUL_THRESHOLD)/
                                 (TARGET_SCORE - CAREFUL_THRESHOLD), 1) *
                                 settings.carefulnessMultiplier;

        score *= (1 - carefulness * 0.4);

        score += floodFillScore * carefulness * 25;

        const frontCollision = snk.slice(1).some(segment =>
        segment.x === nextHead.x + dir.x && segment.y === nextHead.y + dir.y
        );
        if (frontCollision) {
            score -= 1000 * carefulness;
        }

        const pathToTail = findPath(nextHead, snk[snk.length - 1], snk.slice(0, -1));
        if (pathToTail) {
            score += 300 * carefulness;
        } else {
        score -= 600 * carefulness;
        }

        const oppositeDir = { x: -dir.x, y: -dir.y };
        const behindHead = getNextHead(oppositeDir, head);
        if(!isCollision(behindHead,snk)) {
            const spaceBeforeMove = floodFill(behindHead, snk);
            const spaceAfterMove = floodFill(behindHead, [...snk, nextHead]);
            if (spaceAfterMove < spaceBeforeMove) {
                score -= (spaceBeforeMove - spaceAfterMove) * 15 * carefulness;
            }
        }
    }

    if (difficulty === 'easy') {
        score += (customRandom() - 0.5) * 500;
    } else if (difficulty === 'medium') {
        score += (customRandom() - 0.5) * 200;
    }
    return score;
}

function chooseDirection() {
    const availableDirections = getAvailableDirections();
    if (availableDirections.length === 0) return null;
    
    const settings = DIFFICULTY_SETTINGS[difficulty];

    if ((movesSinceLastFood > GRID_SIZE * 2 && customRandom() < settings.makeRandomMove) ||
        (difficulty === 'easy' && customRandom() < 0.2)) {
            return availableDirections[Math.floor(customRandom() * availableDirections.length)];
    }

    const head = snake[0];
    const scores = availableDirections.map(dir => ({
        direction:dir,
        score: evaluateMove(dir, head, snake, food, score)
    }));

    return scores.reduce((best, current) => 
        current.score > best.score ? current : best
    ).direction;
}

function moveSnake() {
    if (gameOver || !gameStarted) return;

    const newDirection = chooseDirection();
    if (!newDirection) {
      endGame();
      return;
    }

    direction = newDirection;
    const newHead = getNextHead(direction);
    snake = [newHead, ...snake];

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 1;
      generateFood();
      movesSinceLastFood = 0;
    } else if (specialFood && newHead.x === specialFood.x && newHead.y === specialFood.y) {
      if (specialFood.type === 'score') {
        score += 3;
      }
      specialFood = null;
      movesSinceLastFood = 0;
    } else {
      snake.pop();
      movesSinceLastFood += 1;
    }

    if (!specialFood) generateSpecialFood();

    
    if (score >= TARGET_SCORE) {
      endGame(true);
      return;
    }

    renderGame();
}


function startGameLoop() {
    if (gameLoopId) clearInterval(gameLoopId);
    
    const settings = DIFFICULTY_SETTINGS[difficulty];
    let gameLoopInterval = settings.gameLoopInterval;
    
    
    if (specialFood && specialFood.type === 'speed') {
      gameLoopInterval = Math.max(gameLoopInterval * 0.5, 40);
    }
    
    gameLoopId = setInterval(moveSnake, gameLoopInterval);
}


function endGame(isWin = false) {
    gameOver = true;
    clearInterval(gameLoopId);
    renderGameOver(isWin);
}

function initGameBoard() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `
      <h1>AI Snake Game v4.5</h1>
      <div class="difficulty-indicator">Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
      <div class="game-board" id="gameBoard" style="width: ${GRID_SIZE * CELL_SIZE}px; height: ${GRID_SIZE * CELL_SIZE}px"></div>
      <div class="score" id="scoreDisplay">Score: 0 / ${TARGET_SCORE}</div>
      <div class="game-over" id="gameOverDisplay"></div>
    `;
}
function renderGame() {
    if (!gameStarted) return;
    
    const gameBoard = document.getElementById('gameBoard');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    
    gameBoard.innerHTML = '';
    
    
    snake.forEach((segment, index) => {
      const segmentElement = document.createElement('div');
      segmentElement.className = index === 0 ? 'snake-segment snake-head' : 'snake-segment';
      segmentElement.style.width = `${CELL_SIZE}px`;
      segmentElement.style.height = `${CELL_SIZE}px`;
      segmentElement.style.left = `${segment.x * CELL_SIZE}px`;
      segmentElement.style.top = `${segment.y * CELL_SIZE}px`;
      gameBoard.appendChild(segmentElement);
    });
    
    
    const foodElement = document.createElement('div');
    foodElement.className = 'food';
    foodElement.style.width = `${CELL_SIZE}px`;
    foodElement.style.height = `${CELL_SIZE}px`;
    foodElement.style.left = `${food.x * CELL_SIZE}px`;
    foodElement.style.top = `${food.y * CELL_SIZE}px`;
    gameBoard.appendChild(foodElement);
    
    
    if (specialFood) {
      const specialFoodElement = document.createElement('div');
      specialFoodElement.className = `special-food special-food-${specialFood.type}`;
      specialFoodElement.style.width = `${CELL_SIZE}px`;
      specialFoodElement.style.height = `${CELL_SIZE}px`;
      specialFoodElement.style.left = `${specialFood.x * CELL_SIZE}px`;
      specialFoodElement.style.top = `${specialFood.y * CELL_SIZE}px`;
      gameBoard.appendChild(specialFoodElement);
    }
    
    
    scoreDisplay.textContent = `Score: ${score} / ${TARGET_SCORE}`;
}

function renderGameOver(isWin) {
    const gameOverDisplay = document.getElementById('gameOverDisplay');
    gameOverDisplay.innerHTML = `
      <div class="game-over-message">
        ${isWin ? "Congratulations! You've won!" : "Game Over!"}
      </div>
      <div class="button-container">
        <button class="restart-button" id="restartButton">Restart Game</button>
        <button class="change-difficulty-button" id="changeDifficultyButton">Change Difficulty</button>
      </div>
    `;
    
    document.getElementById('restartButton').addEventListener('click', restartGame);
    document.getElementById('changeDifficultyButton').addEventListener('click', showDifficultySelection);
}

function renderDifficultySelection() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `
      <h1>AI Snake Game v4.5</h1>
      <div class="difficulty-selection">
        <h2>Select Difficulty</h2>
        <div class="difficulty-buttons">
          <button class="easy-button" id="easyButton">Easy</button>
          <button class="medium-button" id="mediumButton">Medium</button>
          <button class="hard-button" id="hardButton">Hard</button>
        </div>
        <div class="difficulty-info">
          <p><strong>Easy:</strong> The AI makes more mistakes and moves slower.</p>
          <p><strong>Medium:</strong> Balanced AI with occasional mistakes.</p>
          <p><strong>Hard:</strong> Advanced AI that makes optimal moves and moves faster.</p>
        </div>
      </div>
    `;
    
    document.getElementById('easyButton').addEventListener('click', () => startGame('easy'));
    document.getElementById('mediumButton').addEventListener('click', () => startGame('medium'));
    document.getElementById('hardButton').addEventListener('click', () => startGame('hard'));
}
function showDifficultySelection() {
    gameStarted = false;
    if (gameLoopId) clearInterval(gameLoopId);
    renderDifficultySelection();
  }

