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
  if (phase !== "playing") return;

  const redCities = cities.filter(c => c.owner === RED).length;

  if (redCities === 0) {
    paused = true;
    phase = "ended";

    message = "You lost. All your cities were captured.";

    if (typeof showEndMenu === "function") {
      showEndMenu("DEFEAT", "All your cities were captured.");
    }

    return;
  }

  const aliveBots = botIds.filter(id => {
    return players[id] && !players[id].eliminated;
  });

  if (aliveBots.length === 0) {
    paused = true;
    phase = "ended";

    message = "You won. All bots were eliminated.";

    if (typeof showEndMenu === "function") {
      showEndMenu("VICTORY", "All enemy bots were eliminated.");
    }

    return;
  }
}

function update(dt) {
  if (phase === "menu") return;
  if (phase === "ended") return;

  // Warmup eina realiu laiku, ne pagal speed
  if (phase === "warmup") {
    warmupTime -= dt;

    tryChooseBotSpawns(dt);

    if (warmupTime <= 0) {
      finishWarmup();
    }

    return;
  }

  if (paused) return;

  // Nuo čia viskas vyksta pagal speed
  const simDt = dt * gameSpeed;

  gameTime += simDt;
  resourceTickTimer += simDt;

  // Ekonomikos tick kas 1 žaidimo sekundę
  if (resourceTickTimer >= 1) {
    resourceTickTimer = 0;

    for (const city of cities) {
      if (city.owner !== NEUTRAL) {
        players[city.owner].money += city.pop / 10000;
      }
    }
  }

  resolveBattles(simDt);
  captureCities(simDt);
  checkBotEliminations();

  for (const unit of units) {
    moveUnit(unit, simDt);
    captureAroundUnit(unit, simDt);
  }

  removeDeadUnits();
  updateAI(simDt);
  checkWinLoss();
  leaderboardUpdateTimer += simDt;

if (leaderboardUpdateTimer >= 0.5) {
  leaderboardUpdateTimer = 0;
  updateLeaderboardRows();
}
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

if (typeof syncPauseBorder === "function") {
  syncPauseBorder();
}

if (typeof syncSpeedControl === "function") {
  syncSpeedControl();
}

  requestAnimationFrame(loop);
}

resize();
generateMap();
requestAnimationFrame(loop);