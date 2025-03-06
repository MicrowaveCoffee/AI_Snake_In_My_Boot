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
}

const floodFillScore = floodFill(nextHead, [...snk.slice(0,-1), nextHead]);
score += floodFillScore * settings.floodFillWeight;

if (special) {
    const pathToSpecialFood = findPath(nextHead, specialFood, snk);
    if (pathToSpecialFood) {
        const specialFoodScore = specialFood.type === 'score' ? 300: 200;
        score += specialFoodScore * settings.specialFoodWeight - pathToSpecialFood.length * 5;
    }
}
