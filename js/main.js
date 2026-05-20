const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const MAP_W = 180;
const MAP_H = 100;
const TOP_BAR = 44;

const WATER = 0;
const LAND = 1;
const FOREST = 2;
const HILL = 3;

const NEUTRAL = 0;
const RED = 1;
const BLUE = 2;

const CITY_BUILD_COST = 90;
const TROOP_COST = 55;
const TROOP_AMOUNT = 80;
const MIN_CITY_DISTANCE = 12;

const CITY_CAPTURE_RADIUS = 4.5;
const CITY_CAPTURE_TIME = 7;

const UNIT_ENGAGE_RANGE = 6;
const UNIT_DAMAGE = 4.5;

const players = {
  [NEUTRAL]: { name: "Neutral", color: "#9fb85d", dark: "#222", money: 0 },
  [RED]: { name: "Redland", color: "#d63434", dark: "#8f1f1f", money: 170 },
  [BLUE]: { name: "Bluvia", color: "#367dff", dark: "#1d4a9f", money: 170 }
};

const terrain = new Uint8Array(MAP_W * MAP_H);
const owner = new Uint8Array(MAP_W * MAP_H);
const control = new Float32Array(MAP_W * MAP_H);

let cities = [];
let units = [];

let cellSize = 6;
let offsetX = 0;
let offsetY = TOP_BAR;

let gameStarted = false;
let paused = false;
let buildMode = false;

let selectedUnit = null;
let selectedCity = null;
let mouseCell = { x: 0, y: 0 };

let day = 1;
let tickTimer = 0;
let aiOrderTimer = 0;
let aiEcoTimer = 0;

let nextUnitId = 1;
let nextRedCity = 1;
let nextBlueCity = 1;

let message = "Click any land tile to found your first city.";

function idx(x, y) {
  return y * MAP_W + x;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function isLand(x, y) {
  return inBounds(x, y) && terrain[idx(x, y)] !== WATER;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const availableH = window.innerHeight - TOP_BAR;
  cellSize = Math.floor(Math.min(window.innerWidth / MAP_W, availableH / MAP_H));
  cellSize = Math.max(4, cellSize);

  offsetX = Math.floor((window.innerWidth - MAP_W * cellSize) / 2);
  offsetY = TOP_BAR + Math.floor((availableH - MAP_H * cellSize) / 2);
}

function generateMap() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const nx = (x - MAP_W / 2) / (MAP_W / 2);
      const ny = (y - MAP_H / 2) / (MAP_H / 2);

      const islandShape = nx * nx * 1.05 + ny * ny * 1.55;
      const wobble =
        Math.sin(x * 0.11) * 0.12 +
        Math.cos(y * 0.17) * 0.12 +
        Math.sin((x + y) * 0.07) * 0.08;

      const i = idx(x, y);

      if (islandShape > 0.83 + wobble) {
        terrain[i] = WATER;
        owner[i] = NEUTRAL;
        continue;
      }

      terrain[i] = LAND;

      const forestNoise = Math.sin(x * 0.21 + y * 0.05) + Math.cos(y * 0.31);
      const hillNoise = Math.cos(x * 0.14 - y * 0.18);

      if (forestNoise > 1.0) terrain[i] = FOREST;
      if (hillNoise > 0.82 && y > 45) terrain[i] = HILL;

      owner[i] = NEUTRAL;
      control[i] = 0;
    }
  }
}

function screenToCell(mx, my) {
  return {
    x: Math.floor((mx - offsetX) / cellSize),
    y: Math.floor((my - offsetY) / cellSize)
  };
}

function claimCircle(cx, cy, radius, playerId) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (!isLand(x, y)) continue;

      const d = Math.hypot(x - cx, y - cy);
      const roughness = Math.sin(x * 0.4) * 2;

      if (d <= radius + roughness) {
        owner[idx(x, y)] = playerId;
        control[idx(x, y)] = 0;
      }
    }
  }
}

function createCity(name, x, y, playerId, population = 3000) {
  const city = {
    name,
    x,
    y,
    owner: playerId,
    pop: population,
    capture: 0,
    captureBy: NEUTRAL
  };

  cities.push(city);
  claimCircle(x, y, 13, playerId);

  return city;
}

function createUnit(playerId, x, y, soldiers = TROOP_AMOUNT) {
  const unit = {
    id: nextUnitId++,
    owner: playerId,
    x,
    y,
    soldiers,
    speed: playerId === BLUE ? 4.8 : 7.0,
    path: [],
    pinned: false
  };

  units.push(unit);
  return unit;
}

function startGameAt(x, y) {
  if (!isLand(x, y)) {
    message = "Choose land, not water.";
    return;
  }

  const redCity = createCity("Red Capital", x, y, RED, 5200);
  const redUnit = createUnit(RED, x + 2, y + 1, 120);

  const blueSpot = findFarLandSpot(x, y, 65);
  const blueCity = createCity("Blue Capital", blueSpot.x, blueSpot.y, BLUE, 5200);

  createUnit(BLUE, blueSpot.x - 2, blueSpot.y + 1, 120);
  createUnit(BLUE, blueSpot.x + 3, blueSpot.y - 2, 90);

  selectedCity = redCity;
  selectedUnit = redUnit;
  gameStarted = true;

  message = "Game started. Select city + T to buy troops. B to build city.";
}

function findFarLandSpot(x, y, minDistance) {
  for (let a = 0; a < 5000; a++) {
    const rx = Math.floor(Math.random() * MAP_W);
    const ry = Math.floor(Math.random() * MAP_H);

    if (!isLand(rx, ry)) continue;
    if (Math.hypot(rx - x, ry - y) < minDistance) continue;

    return { x: rx, y: ry };
  }

  return { x: MAP_W - x - 1, y: MAP_H - y - 1 };
}

function terrainDefense(x, y) {
  if (!isLand(x, y)) return 1;

  const t = terrain[idx(x, y)];

  if (t === FOREST) return 1.5;
  if (t === HILL) return 2.0;

  return 1.0;
}

function terrainSpeed(x, y) {
  if (!isLand(x, y)) return 1;

  const t = terrain[idx(x, y)];

  if (t === FOREST) return 0.72;
  if (t === HILL) return 0.52;

  return 1.0;
}

function hasNeighborOwner(x, y, playerId) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;

    if (!inBounds(nx, ny)) continue;
    if (owner[idx(nx, ny)] === playerId) return true;
  }

  return false;
}

function isBorderCell(x, y) {
  if (!isLand(x, y)) return false;

  const currentOwner = owner[idx(x, y)];

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;

    if (!isLand(nx, ny)) continue;
    if (owner[idx(nx, ny)] !== currentOwner) return true;
  }

  return false;
}

function findPath(startX, startY, goalX, goalY) {
  if (!isLand(goalX, goalY)) return [];

  const start = idx(startX, startY);
  const goal = idx(goalX, goalY);

  const cameFrom = new Int32Array(MAP_W * MAP_H);
  cameFrom.fill(-1);

  const queue = new Int32Array(MAP_W * MAP_H);
  let head = 0;
  let tail = 0;

  queue[tail++] = start;
  cameFrom[start] = start;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  while (head < tail) {
    const current = queue[head++];
    const cx = current % MAP_W;
    const cy = Math.floor(current / MAP_W);

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (!isLand(nx, ny)) continue;

      const next = idx(nx, ny);
      if (cameFrom[next] !== -1) continue;

      cameFrom[next] = current;

      if (next === goal) {
        return reconstructPath(cameFrom, start, goal);
      }

      queue[tail++] = next;
    }
  }

  return [];
}

function reconstructPath(cameFrom, start, goal) {
  const path = [];
  let current = goal;

  while (current !== start) {
    path.push({
      x: current % MAP_W,
      y: Math.floor(current / MAP_W)
    });

    current = cameFrom[current];

    if (current < 0) return [];
  }

  path.reverse();
  return path;
}

function issueMoveOrder(unit, x, y) {
  x = Math.floor(x);
  y = Math.floor(y);

  const startX = Math.floor(unit.x);
  const startY = Math.floor(unit.y);

  const path = findPath(startX, startY, x, y);

  if (path.length === 0) {
    message = "No land path to target.";
    return;
  }

  unit.path = path;
  message = "Move order issued.";
}

function moveUnit(unit, dt) {
  if (unit.pinned) return;
  if (!unit.path || unit.path.length === 0) return;

  const next = unit.path[0];

  const tx = next.x + 0.5;
  const ty = next.y + 0.5;

  const dx = tx - unit.x;
  const dy = ty - unit.y;

  const dist = Math.hypot(dx, dy);

  if (dist < 0.12) {
    unit.x = tx;
    unit.y = ty;
    unit.path.shift();
    return;
  }

  const speed = unit.speed * terrainSpeed(Math.floor(unit.x), Math.floor(unit.y)) * dt;
  const step = Math.min(speed, dist);

  unit.x += (dx / dist) * step;
  unit.y += (dy / dist) * step;
}

function captureAroundUnit(unit, dt) {
  if (unit.pinned) return;

  const ux = Math.floor(unit.x);
  const uy = Math.floor(unit.y);

  const radius = 4;
  const power = unit.soldiers * dt * 0.35;

  for (let y = uy - radius; y <= uy + radius; y++) {
    for (let x = ux - radius; x <= ux + radius; x++) {
      if (!isLand(x, y)) continue;

      const i = idx(x, y);

      if (owner[i] === unit.owner) continue;
      if (!hasNeighborOwner(x, y, unit.owner)) continue;

      const d = Math.hypot(x - unit.x, y - unit.y);
      if (d > radius) continue;

      const enemyBonus = owner[i] === NEUTRAL ? 0.8 : 1.8;
      const defense = terrainDefense(x, y) * enemyBonus;

      control[i] += (power / defense) * (1 - d / (radius + 1));

      if (control[i] > 12) {
        owner[i] = unit.owner;
        control[i] = 0;
      }
    }
  }
}

function resolveBattles(dt) {
  for (const unit of units) {
    unit.pinned = false;
  }

  for (let a = 0; a < units.length; a++) {
    for (let b = a + 1; b < units.length; b++) {
      const u1 = units[a];
      const u2 = units[b];

      if (u1.owner === u2.owner) continue;
      if (u1.soldiers <= 0 || u2.soldiers <= 0) continue;

      const d = Math.hypot(u1.x - u2.x, u1.y - u2.y);
      if (d > UNIT_ENGAGE_RANGE) continue;

      u1.pinned = true;
      u2.pinned = true;

      u1.path = [];
      u2.path = [];

      const u1Def = terrainDefense(Math.floor(u1.x), Math.floor(u1.y));
      const u2Def = terrainDefense(Math.floor(u2.x), Math.floor(u2.y));

      const dmgToU2 = UNIT_DAMAGE * dt * (u1.soldiers / 100) / u2Def;
      const dmgToU1 = UNIT_DAMAGE * dt * (u2.soldiers / 100) / u1Def;

      u2.soldiers -= dmgToU2;
      u1.soldiers -= dmgToU1;
    }
  }
}

function removeDeadUnits() {
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].soldiers <= 1) {
      if (selectedUnit === units[i]) selectedUnit = null;
      units.splice(i, 1);
    }
  }
}

function captureCities(dt) {
  for (const city of cities) {
    const nearby = units.filter(
      u => u.soldiers > 0 && Math.hypot(u.x - city.x, u.y - city.y) <= CITY_CAPTURE_RADIUS
    );

    if (nearby.length === 0) {
      city.capture = Math.max(0, city.capture - dt * 0.75);
      continue;
    }

    const sides = [...new Set(nearby.map(u => u.owner))];

    if (sides.length > 1) {
      city.capture = Math.max(0, city.capture - dt * 0.4);
      message = `${city.name} is contested.`;
      continue;
    }

    const capturingOwner = sides[0];

    if (city.owner === capturingOwner) {
      city.capture = 0;
      city.captureBy = NEUTRAL;
      continue;
    }

    if (city.captureBy !== capturingOwner) {
      city.captureBy = capturingOwner;
      city.capture = 0;
    }

    const strength = nearby.reduce((sum, u) => sum + u.soldiers, 0) / 100;
    city.capture += dt * Math.max(0.6, strength);

    message = `${players[capturingOwner].name} capturing ${city.name}: ${Math.floor(
      (city.capture / CITY_CAPTURE_TIME) * 100
    )}%`;

    if (city.capture >= CITY_CAPTURE_TIME) {
      city.owner = capturingOwner;
      city.capture = 0;
      city.captureBy = NEUTRAL;

      claimCircle(city.x, city.y, 9, capturingOwner);

      message = `${players[capturingOwner].name} captured ${city.name}.`;
    }
  }
}

function tooCloseToCity(x, y) {
  for (const c of cities) {
    if (Math.hypot(c.x - x, c.y - y) < MIN_CITY_DISTANCE) return true;
  }

  return false;
}

function tryBuildCity(x, y) {
  if (!isLand(x, y)) {
    message = "Cannot build on water.";
    return;
  }

  if (owner[idx(x, y)] !== RED) {
    message = "Build only on your territory.";
    return;
  }

  if (tooCloseToCity(x, y)) {
    message = "Too close to another city.";
    return;
  }

  if (players[RED].money < CITY_BUILD_COST) {
    message = `Need ${CITY_BUILD_COST} money.`;
    return;
  }

  players[RED].money -= CITY_BUILD_COST;

  selectedCity = createCity(`Red City ${nextRedCity++}`, x, y, RED, 2600);
  selectedUnit = null;

  message = `${selectedCity.name} built.`;
}

function buyTroops() {
  if (!selectedCity || selectedCity.owner !== RED) {
    message = "Select your city first.";
    return;
  }

  if (players[RED].money < TROOP_COST) {
    message = `Need ${TROOP_COST} money.`;
    return;
  }

  players[RED].money -= TROOP_COST;
  selectedUnit = createUnit(RED, selectedCity.x + 2, selectedCity.y + 1, TROOP_AMOUNT);

  message = `Bought ${TROOP_AMOUNT} troops at ${selectedCity.name}.`;
}

function nearestCity(cell, maxDist = 4) {
  let best = null;
  let bestD = maxDist;

  for (const city of cities) {
    const d = Math.hypot(city.x - cell.x, city.y - cell.y);

    if (d < bestD) {
      best = city;
      bestD = d;
    }
  }

  return best;
}

function nearestEnemyCity(unit) {
  let best = null;
  let bestD = Infinity;

  for (const city of cities) {
    if (city.owner === unit.owner) continue;

    const d = Math.hypot(city.x - unit.x, city.y - unit.y);

    if (d < bestD) {
      best = city;
      bestD = d;
    }
  }

  return best;
}

function findOwnedBuildSpot(playerId) {
  for (let a = 0; a < 1000; a++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);

    if (!isLand(x, y)) continue;
    if (owner[idx(x, y)] !== playerId) continue;
    if (tooCloseToCity(x, y)) continue;

    return { x, y };
  }

  return null;
}

function updateAI(dt) {
  aiOrderTimer += dt;
  aiEcoTimer += dt;

  if (aiOrderTimer >= 4) {
    aiOrderTimer = 0;

    for (const unit of units) {
      if (unit.owner !== BLUE) continue;
      if (unit.pinned) continue;
      if (unit.path.length > 0) continue;

      const target = nearestEnemyCity(unit);
      if (target) {
        issueMoveOrder(unit, target.x, target.y);
      }
    }
  }

  if (aiEcoTimer >= 5) {
    aiEcoTimer = 0;

    const blueCities = cities.filter(c => c.owner === BLUE);
    if (blueCities.length === 0) return;

    if (players[BLUE].money >= TROOP_COST) {
      const city = blueCities[Math.floor(Math.random() * blueCities.length)];
      players[BLUE].money -= TROOP_COST;
      createUnit(BLUE, city.x - 2, city.y + 1, TROOP_AMOUNT);
    }

    if (players[BLUE].money >= CITY_BUILD_COST + 40 && Math.random() < 0.35) {
      const spot = findOwnedBuildSpot(BLUE);

      if (spot) {
        players[BLUE].money -= CITY_BUILD_COST;
        createCity(`Blue City ${nextBlueCity++}`, spot.x, spot.y, BLUE, 2600);
      }
    }
  }
}

function checkWinLoss() {
  if (!gameStarted) return;

  const redCities = cities.filter(c => c.owner === RED).length;
  const blueCities = cities.filter(c => c.owner === BLUE).length;

  if (redCities === 0) {
    paused = true;
    message = "You lost. Blue captured all your cities.";
  }

  if (blueCities === 0) {
    paused = true;
    message = "You won. Blue has no cities left.";
  }
}

function update(dt) {
  if (!gameStarted || paused) return;

  tickTimer += dt;

  if (tickTimer >= 0.12) {
    tickTimer = 0;
    day++;

    for (const city of cities) {
      if (city.owner !== NEUTRAL) {
        players[city.owner].money += city.pop / 10000;
      }
    }
  }

  resolveBattles(dt);
  captureCities(dt);

  for (const unit of units) {
    moveUnit(unit, dt);
    captureAroundUnit(unit, dt);
  }

  removeDeadUnits();
  updateAI(dt);
  checkWinLoss();
}

function terrainColor(t) {
  if (t === WATER) return "#2386bd";
  if (t === FOREST) return "#4f883b";
  if (t === HILL) return "#77786a";
  return "#9fb85d";
}

function mixColor(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);

  const r = Math.round(ca.r * (1 - amount) + cb.r * amount);
  const g = Math.round(ca.g * (1 - amount) + cb.g * amount);
  const bl = Math.round(ca.b * (1 - amount) + cb.b * amount);

  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

function drawTopBar() {
  ctx.fillStyle = "#07101a";
  ctx.fillRect(0, 0, window.innerWidth, TOP_BAR);

  ctx.fillStyle = "white";
  ctx.font = "bold 20px Arial";
  ctx.fillText("WARCELL", 16, 28);

  ctx.font = "14px Arial";

  ctx.fillStyle = players[RED].color;
  ctx.fillText(`Red money: ${Math.floor(players[RED].money)}`, 160, 27);

  ctx.fillStyle = players[BLUE].color;
  ctx.fillText(`Blue money: ${Math.floor(players[BLUE].money)}`, 310, 27);

  ctx.fillStyle = buildMode ? "#ffd34d" : "#dce7f2";
  ctx.fillText(
    buildMode ? `BUILD MODE: city ${CITY_BUILD_COST}` : `B: build city | T: buy troops`,
    470,
    27
  );

  ctx.fillStyle = "#dce7f2";
  ctx.fillText(`Day ${day}`, window.innerWidth - 170, 27);
  ctx.fillText(paused ? "Paused" : gameStarted ? "Running" : "Choose land", window.innerWidth - 95, 27);
}

function drawMap() {
  ctx.fillStyle = "#1f77a8";
  ctx.fillRect(0, TOP_BAR, window.innerWidth, window.innerHeight - TOP_BAR);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = idx(x, y);

      const sx = offsetX + x * cellSize;
      const sy = offsetY + y * cellSize;

      if (terrain[i] === WATER) {
        ctx.fillStyle = "#2386bd";
      } else {
        const base = terrainColor(terrain[i]);
        const own = owner[i];

        ctx.fillStyle = own === NEUTRAL ? base : mixColor(base, players[own].color, 0.45);
      }

      ctx.fillRect(sx, sy, cellSize, cellSize);

      if (terrain[i] !== WATER && isBorderCell(x, y)) {
        ctx.fillStyle = owner[i] === NEUTRAL ? "#222" : players[owner[i]].dark;
        ctx.fillRect(sx, sy, cellSize, cellSize);
      }
    }
  }

  drawRiver();
}

function drawRiver() {
  ctx.strokeStyle = "#45aee8";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  ctx.beginPath();
  moveToCell(90, 13);
  curveToCell(82, 35, 94, 46, 88, 62);
  curveToCell(84, 73, 100, 76, 109, 92);
  ctx.stroke();
}

function moveToCell(x, y) {
  ctx.moveTo(offsetX + x * cellSize + cellSize / 2, offsetY + y * cellSize + cellSize / 2);
}

function curveToCell(x1, y1, x2, y2, x3, y3) {
  ctx.bezierCurveTo(
    offsetX + x1 * cellSize,
    offsetY + y1 * cellSize,
    offsetX + x2 * cellSize,
    offsetY + y2 * cellSize,
    offsetX + x3 * cellSize,
    offsetY + y3 * cellSize
  );
}

function drawCities() {
  for (const city of cities) {
    const sx = offsetX + city.x * cellSize + cellSize / 2;
    const sy = offsetY + city.y * cellSize + cellSize / 2;

    ctx.fillStyle = selectedCity === city ? "#fff" : "#111";
    ctx.beginPath();
    ctx.arc(sx, sy, selectedCity === city ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = players[city.owner].color;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();

    if (city.capture > 0) {
      const progress = Math.min(1, city.capture / CITY_CAPTURE_TIME);

      ctx.strokeStyle = players[city.captureBy].color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(city.name, sx + 10, sy + 4);
  }
}

function drawUnits() {
  for (const unit of units) {
    const sx = offsetX + unit.x * cellSize + cellSize / 2;
    const sy = offsetY + unit.y * cellSize + cellSize / 2;

    if (unit.path.length > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);

      const preview = Math.min(unit.path.length, 14);

      for (let i = 0; i < preview; i++) {
        ctx.lineTo(
          offsetX + unit.path[i].x * cellSize + cellSize / 2,
          offsetY + unit.path[i].y * cellSize + cellSize / 2
        );
      }

      ctx.stroke();
    }

    ctx.fillStyle = selectedUnit === unit ? "#fff" : "#111";
    ctx.beginPath();
    ctx.arc(sx, sy, unit.pinned ? 12 : 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = players[unit.owner].color;
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(unit.soldiers), sx, sy - 12);

    if (unit.pinned) {
      ctx.fillStyle = "#ffd34d";
      ctx.fillText("PINNED", sx, sy + 22);
    }

    ctx.textAlign = "left";
  }
}

function drawPanel() {
  ctx.fillStyle = "rgba(5, 12, 20, 0.84)";
  ctx.fillRect(16, window.innerHeight - 126, 540, 110);

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";

  ctx.fillText("Start: click any land tile. AI chooses random land far away.", 30, window.innerHeight - 96);
  ctx.fillText("Left click city = select city. T = buy troops at city.", 30, window.innerHeight - 72);
  ctx.fillText("Left click unit = select unit. Right click = move/attack.", 30, window.innerHeight - 48);
  ctx.fillText("B = build city mode. Build only on your territory.", 30, window.innerHeight - 24);

  ctx.fillStyle = "#ffd34d";
  ctx.fillText(message, 30, window.innerHeight - 5);
}

function drawBuildCursor() {
  if (!inBounds(mouseCell.x, mouseCell.y)) return;

  const sx = offsetX + mouseCell.x * cellSize + cellSize / 2;
  const sy = offsetY + mouseCell.y * cellSize + cellSize / 2;

  ctx.strokeStyle = owner[idx(mouseCell.x, mouseCell.y)] === RED ? "#ffd34d" : "#ff5555";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(sx, sy, MIN_CITY_DISTANCE * cellSize, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSpawnOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, TOP_BAR, window.innerWidth, window.innerHeight - TOP_BAR);

  ctx.fillStyle = "white";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Found your first city", window.innerWidth / 2, TOP_BAR + 52);

  ctx.font = "16px Arial";
  ctx.fillText("Click any land spot. No premade cities.", window.innerWidth / 2, TOP_BAR + 82);

  ctx.textAlign = "left";
}

function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawTopBar();
  drawMap();
  drawCities();
  drawUnits();
  drawPanel();

  if (!gameStarted) drawSpawnOverlay();
  if (buildMode) drawBuildCursor();
}

canvas.addEventListener("mousemove", e => {
  mouseCell = screenToCell(e.clientX, e.clientY);
});

canvas.addEventListener("click", e => {
  const cell = screenToCell(e.clientX, e.clientY);

  if (!inBounds(cell.x, cell.y)) return;

  if (!gameStarted) {
    startGameAt(cell.x, cell.y);
    return;
  }

  if (buildMode) {
    tryBuildCity(cell.x, cell.y);
    return;
  }

  selectedUnit = null;
  selectedCity = null;

  for (const unit of units) {
    if (unit.owner !== RED) continue;

    if (Math.hypot(unit.x - cell.x, unit.y - cell.y) < 3) {
      selectedUnit = unit;
      message = `Selected unit: ${Math.ceil(unit.soldiers)} soldiers.`;
      return;
    }
  }

  const city = nearestCity(cell, 4);

  if (city && city.owner === RED) {
    selectedCity = city;
    message = `Selected ${city.name}. Press T to buy troops.`;
  }
});

canvas.addEventListener("contextmenu", e => {
  e.preventDefault();

  if (!selectedUnit) return;

  const cell = screenToCell(e.clientX, e.clientY);

  if (!inBounds(cell.x, cell.y)) return;
  if (!isLand(cell.x, cell.y)) return;

  issueMoveOrder(selectedUnit, cell.x, cell.y);
});

window.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (e.code === "Space") {
    paused = !paused;
  }

  if (key === "b" && gameStarted) {
    buildMode = !buildMode;
    selectedUnit = null;

    message = buildMode
      ? `Build mode ON. City cost: ${CITY_BUILD_COST}.`
      : "Build mode OFF.";
  }

  if (key === "t" && gameStarted) {
    buyTroops();
  }
});

window.addEventListener("resize", resize);

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

resize();
generateMap();
requestAnimationFrame(loop);