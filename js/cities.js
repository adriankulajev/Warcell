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

function startWarmup(botCount, warmupSeconds = WARMUP_SECONDS) {
  resetGameState(botCount, warmupSeconds);

  phase = "warmup";
  message = `Warmup started. Choose your spawn. Bots: ${botCountSetting}.`;
}

function chooseRedSpawn(x, y) {
  if (!isLand(x, y)) {
    message = "Choose land, not water.";
    return;
  }

  for (const spawn of botSpawns) {
    const d = Math.hypot(x - spawn.x, y - spawn.y);

    if (d < MIN_SPAWN_DISTANCE) {
      message = "Too close to a bot spawn. Choose farther away.";
      return;
    }
  }

  redSpawn = { x, y, owner: RED };
  message = "Spawn selected. You can change it before warmup ends.";
}

function tryChooseBotSpawns(dt) {
  if (!redSpawn) return;

  for (const plan of botSpawnPlans) {
    if (plan.chosen) continue;

    plan.delay -= dt;

    if (plan.delay > 0) continue;

    const spawn = findSpawnAwayFromExisting();

    botSpawns.push({
      x: spawn.x,
      y: spawn.y,
      owner: plan.owner
    });

    plan.chosen = true;
    message = `${players[plan.owner].name} has chosen spawn.`;
  }
}

function findSpawnAwayFromExisting() {
  const avoid = [];

  if (redSpawn) avoid.push(redSpawn);
  for (const s of botSpawns) avoid.push(s);

  let best = null;
  let bestScore = -1;

  for (let a = 0; a < 8000; a++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);

    if (!isLand(x, y)) continue;

    let minD = Infinity;

    for (const p of avoid) {
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < minD) minD = d;
    }

    if (minD >= MIN_SPAWN_DISTANCE) {
      return { x, y };
    }

    if (minD > bestScore) {
      bestScore = minD;
      best = { x, y };
    }
  }

  return best || findRandomLandSpot();
}

function finishWarmup() {
  if (!redSpawn) {
    redSpawn = findRandomLandSpot();
    redSpawn.owner = RED;
  }

  for (const plan of botSpawnPlans) {
    if (plan.chosen) continue;

    const spawn = findSpawnAwayFromExisting();

    botSpawns.push({
      x: spawn.x,
      y: spawn.y,
      owner: plan.owner
    });

    plan.chosen = true;
  }

  const redCity = createCity(
    `${players[RED].name} Capital`,
    redSpawn.x,
    redSpawn.y,
    RED,
    5200
  );

  const redUnit = createUnit(
    RED,
    redSpawn.x + 2,
    redSpawn.y + 1,
    120
  );

  for (const spawn of botSpawns) {
    const bot = players[spawn.owner];

    createCity(`${bot.name} Capital`, spawn.x, spawn.y, spawn.owner, 5200);

    createUnit(spawn.owner, spawn.x - 2, spawn.y + 1, 120);
    createUnit(spawn.owner, spawn.x + 3, spawn.y - 2, 90);
  }

  selectedCity = redCity;
  selectedUnit = redUnit;

  gameStarted = true;
  phase = "playing";

  updateLeaderboardRows();

  message = "War started.";
}

function findRandomLandSpot() {
  for (let a = 0; a < 5000; a++) {
    const x = Math.floor(Math.random() * MAP_W);
    const y = Math.floor(Math.random() * MAP_H);

    if (isLand(x, y)) {
      return { x, y };
    }
  }

  return {
    x: Math.floor(MAP_W / 2),
    y: Math.floor(MAP_H / 2)
  };
}

function findFarLandSpot(x, y, minDistance) {
  let best = null;
  let bestDistance = 0;

  for (let a = 0; a < 8000; a++) {
    const rx = Math.floor(Math.random() * MAP_W);
    const ry = Math.floor(Math.random() * MAP_H);

    if (!isLand(rx, ry)) continue;

    const distance = Math.hypot(rx - x, ry - y);

    if (distance >= minDistance) {
      return { x: rx, y: ry };
    }

    if (distance > bestDistance) {
      bestDistance = distance;
      best = { x: rx, y: ry };
    }
  }

  return best || {
    x: MAP_W - x - 1,
    y: MAP_H - y - 1
  };
}

function captureCities(dt) {
  for (const city of cities) {
    const nearby = units.filter(
      u =>
        u.soldiers > 0 &&
        Math.hypot(u.x - city.x, u.y - city.y) <= CITY_CAPTURE_RADIUS
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
    if (Math.hypot(c.x - x, c.y - y) < MIN_CITY_DISTANCE) {
      return true;
    }
  }

  return false;
}

function tryBuildCity(x, y) {
  if (!isLand(x, y)) {
    message = "Cannot build on water.";
    return;
  }

  const redHasCity = cities.some(c => c.owner === RED);

  if (!redHasCity) {
    message = "You need at least one city to build new cities.";
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

  selectedUnit = createUnit(
    RED,
    selectedCity.x + 2,
    selectedCity.y + 1,
    TROOP_AMOUNT
  );

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