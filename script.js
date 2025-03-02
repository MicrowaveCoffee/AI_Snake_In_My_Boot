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


