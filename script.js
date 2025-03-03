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

