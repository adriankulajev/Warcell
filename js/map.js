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
  totalLandCells = 0;

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
        control[i] = 0;
        cellCity[i] = 0;
        neutralClaimOwner[i] = NEUTRAL;
        previousOwner[i] = NEUTRAL;
        occupation[i] = 0;
        continue;
      }

      terrain[i] = LAND;
      totalLandCells++;

      const forestNoise = Math.sin(x * 0.21 + y * 0.05) + Math.cos(y * 0.31);
      const hillNoise = Math.cos(x * 0.14 - y * 0.18);

      if (forestNoise > 1.0) terrain[i] = FOREST;
      if (hillNoise > 0.82 && y > 45) terrain[i] = HILL;

      owner[i] = NEUTRAL;
      control[i] = 0;
      cellCity[i] = 0;
      neutralClaimOwner[i] = NEUTRAL;
      previousOwner[i] = NEUTRAL;
      occupation[i] = 0;
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

function claimCircle(cx, cy, radius, playerId, cityId = 0, claimMode = "all") {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (!isLand(x, y)) continue;

      const d = Math.hypot(x - cx, y - cy);
      const roughness = Math.sin(x * 0.4) * 2;

      if (d <= radius + roughness) {
        const i = idx(x, y);
        const currentOwner = owner[i];

        if (claimMode === "neutralOrOwn") {
          if (currentOwner !== NEUTRAL && currentOwner !== playerId) {
            continue;
          }
        }

        setCellOwner(i, playerId, cityId);

        if (cityId) {
          cellCity[i] = cityId;
        } else {
          cellCity[i] = findNearestCityIdForOwner(x, y, playerId);
        }

        if (cityId) {
          cellCity[i] = cityId;
        } else {
          cellCity[i] = findNearestCityIdForOwner(x, y, playerId);
        }
      }
    }
  }
}

function setCellOwner(i, newOwner, cityId = 0) {
  const oldOwner = owner[i];

  if (oldOwner === newOwner) {
    if (cityId) cellCity[i] = cityId;

    if (previousOwner[i] === newOwner) {
      previousOwner[i] = NEUTRAL;
      occupation[i] = 0;
      ownershipDirty = true;
    }

    return;
  }

  // Liberation: the original owner recaptures occupied land
  if (previousOwner[i] === newOwner) {
    previousOwner[i] = NEUTRAL;
    occupation[i] = 0;
  }

  // Enemy land capture: occupied territory
  else if (oldOwner !== NEUTRAL && newOwner !== NEUTRAL) {
    previousOwner[i] = oldOwner;
    occupation[i] = 1;
  }

  // Neutral capture or becoming neutral: no occupation
  else {
    previousOwner[i] = NEUTRAL;
    occupation[i] = 0;
  }

  owner[i] = newOwner;
  control[i] = 0;
  neutralClaimOwner[i] = NEUTRAL;

  if (cityId) {
    cellCity[i] = cityId;
  } else {
    cellCity[i] = findNearestCityIdForOwner(
      i % MAP_W,
      Math.floor(i / MAP_W),
      newOwner
    );
  }

  ownershipDirty = true;
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

function isCityFieldBorderCell(x, y) {
  if (!isLand(x, y)) return false;

  const i = idx(x, y);
  const currentOwner = owner[i];
  const currentCity = cellCity[i];

  if (currentOwner === NEUTRAL) return false;
  if (currentCity === 0) return false;

  const dirs = [
    [1, 0],
    [0, 1]
  ];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;

    if (!isLand(nx, ny)) continue;

    const ni = idx(nx, ny);

    if (owner[ni] !== currentOwner) continue;
    if (cellCity[ni] === 0) continue;

    if (cellCity[ni] !== currentCity) {
      return true;
    }
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