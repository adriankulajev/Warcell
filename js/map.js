function idx(x, y) {
  return y * MAP_W + x;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function isLand(x, y) {
  return inBounds(x, y) && terrain[idx(x, y)] !== WATER;
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
  terrainDirty = true;
  ownershipDirty = true;
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
  const i = idx(x, y);

  if (owner[i] !== playerId) {
    owner[i] = playerId;
    control[i] = 0;
    ownershipDirty = true;
  }
}
    }
  }
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