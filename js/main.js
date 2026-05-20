function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const availableH = window.innerHeight - TOP_BAR;

  cellSize = Math.floor(Math.min(
    window.innerWidth / MAP_W,
    availableH / MAP_H
  ));

  cellSize = Math.max(4, cellSize);

  offsetX = Math.floor((window.innerWidth - MAP_W * cellSize) / 2);
  offsetY = TOP_BAR + Math.floor((availableH - MAP_H * cellSize) / 2);
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
  if (phase === "menu") return;

  if (phase === "warmup") {
    warmupTime -= dt;

    tryChooseBotSpawns(dt);

    if (warmupTime <= 0) {
      finishWarmup();
    }

    return;
  }

  if (paused) return;

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

function updateFPS(rawDt) {
  fpsTimer += rawDt;
  fpsFrames++;

  if (fpsTimer >= 0.5) {
    fps = Math.round(fpsFrames / fpsTimer);
    fpsFrames = 0;
    fpsTimer = 0;
  }
}

function loop(now) {
  const rawDt = (now - lastTime) / 1000;
  const dt = Math.min(0.033, rawDt);

  lastTime = now;

  updateFPS(rawDt);
  update(dt);
  draw();

  requestAnimationFrame(loop);
}

resize();
generateMap();
requestAnimationFrame(loop);

window.addEventListener("resize", resize);

let lastTime = performance.now();

function loop(now) {
  const rawDt = (now - lastTime) / 1000;
  const dt = Math.min(0.033, rawDt);

  lastTime = now;

  fpsFrames++;

  if (now - fpsLastUpdate >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsLastUpdate));
    fpsFrames = 0;
    fpsLastUpdate = now;
  }

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

resize();
generateMap();
requestAnimationFrame(loop);

resize();
generateMap();
requestAnimationFrame(loop);