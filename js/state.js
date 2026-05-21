let phase = "menu";
let pauseMenuOpen = false;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const terrain = new Uint8Array(MAP_W * MAP_H);
const owner = new Uint8Array(MAP_W * MAP_H);
const control = new Float32Array(MAP_W * MAP_H);

const terrainCanvas = document.createElement("canvas");
terrainCanvas.width = MAP_W;
terrainCanvas.height = MAP_H;
const terrainCtx = terrainCanvas.getContext("2d");

const ownershipCanvas = document.createElement("canvas");
ownershipCanvas.width = MAP_W;
ownershipCanvas.height = MAP_H;
const ownershipCtx = ownershipCanvas.getContext("2d");

let terrainDirty = true;
let ownershipDirty = true;

let cities = [];
let units = [];

let cellSize = 6;
let offsetX = 0;
let offsetY = TOP_BAR;

let totalLandCells = 0;

let leaderboardRows = [];
let leaderboardUpdateTimer = 0;

let gameStarted = false;
let paused = false;
let buildMode = false;

let botCountSetting = DEFAULT_BOT_COUNT;
let botIds = [];

let warmupSetting = WARMUP_SECONDS;
let warmupTime = WARMUP_SECONDS;

let redSpawn = null;
let botSpawns = [];
let botSpawnPlans = [];

let selectedUnit = null;
let selectedCity = null;
let mouseCell = { x: 0, y: 0 };

let gameTime = 0; // seconds since war started
let gameSpeed = 1;

let resourceTickTimer = 0;
let aiOrderTimer = 0;
let aiEcoTimer = 0;

let nextUnitId = 1;
let nextRedCity = 1;
let nextBotCity = 1;

let endResultTitle = "";
let endResultMessage = "";

let message = "Main menu.";

let fps = 0;
let fpsFrames = 0;
let fpsLastUpdate = performance.now();