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

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
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

  const aliveBots = botIds.filter(id =>
    cities.some(c => c.owner === id) || units.some(u => u.owner === id)
  ).length;

  ctx.fillStyle = "#dce7f2";
  ctx.fillText(`Bots alive: ${aliveBots}/${botCountSetting}`, 310, 27);

  ctx.fillStyle = buildMode ? "#ffd34d" : "#dce7f2";
  ctx.fillText("B: build city | T: buy troops", 470, 27);

  ctx.fillStyle = fps < 30 ? "#ff5555" : fps < 50 ? "#ffd34d" : "#7CFF7C";
  ctx.fillText(`FPS: ${fps}`, window.innerWidth - 420, 27);

  ctx.fillStyle = "#dce7f2";
  ctx.fillText(`Time ${formatTime(gameTime)}`, window.innerWidth - 320, 27);

  let statusText = "Menu";

  if (phase === "warmup") statusText = "Choose land";
  if (phase === "playing") statusText = paused ? "Paused" : "Running";

  ctx.fillStyle = paused ? "#7CFF7C" : "#dce7f2";
  ctx.fillText(statusText, window.innerWidth - 80, 27);
}

function updateTerrainCache() {
  if (!terrainDirty) return;

  terrainCtx.clearRect(0, 0, MAP_W, MAP_H);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = idx(x, y);
      terrainCtx.fillStyle = terrainColor(terrain[i]);
      terrainCtx.fillRect(x, y, 1, 1);
    }
  }

  terrainDirty = false;
}

function updateOwnershipCache() {
  if (!ownershipDirty) return;

  ownershipCtx.clearRect(0, 0, MAP_W, MAP_H);

  // Territory color layer
  ownershipCtx.save();
  ownershipCtx.globalAlpha = 0.45;

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = idx(x, y);

      if (terrain[i] === WATER) continue;

      const own = owner[i];
      if (own === NEUTRAL) continue;

      ownershipCtx.fillStyle = players[own].color;
      ownershipCtx.fillRect(x, y, 1, 1);
    }
  }

  ownershipCtx.restore();

  // Border layer
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const i = idx(x, y);

      if (terrain[i] === WATER) continue;
      if (!isBorderCell(x, y)) continue;

      const own = owner[i];
      ownershipCtx.fillStyle = own === NEUTRAL ? "#222" : players[own].dark;
      ownershipCtx.fillRect(x, y, 1, 1);
    }
  }

  ownershipDirty = false;
}

function drawMap() {
  updateTerrainCache();
  updateOwnershipCache();

  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#1f77a8";
  ctx.fillRect(0, TOP_BAR, window.innerWidth, window.innerHeight - TOP_BAR);

  const drawW = MAP_W * cellSize;
  const drawH = MAP_H * cellSize;

  ctx.drawImage(
    terrainCanvas,
    offsetX,
    offsetY,
    drawW,
    drawH
  );

  ctx.drawImage(
    ownershipCanvas,
    offsetX,
    offsetY,
    drawW,
    drawH
  );

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
  ctx.moveTo(
    offsetX + x * cellSize + cellSize / 2,
    offsetY + y * cellSize + cellSize / 2
  );
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
      ctx.arc(
        sx,
        sy,
        12,
        -Math.PI / 2,
        -Math.PI / 2 + progress * Math.PI * 2
      );
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

  ctx.fillText(
    "Start: click any land tile. AI chooses random land far away.",
    30,
    window.innerHeight - 96
  );
  ctx.fillText(
    "Left click city = select city. T = buy troops at city.",
    30,
    window.innerHeight - 72
  );
  ctx.fillText(
    "Left click unit = select unit. Right click = move/attack.",
    30,
    window.innerHeight - 48
  );
  ctx.fillText(
    "B = build city mode. Build only on your territory.",
    30,
    window.innerHeight - 24
  );

  ctx.fillStyle = "#ffd34d";
  ctx.fillText(message, 30, window.innerHeight - 5);
}

function updateLeaderboardRows() {
  const landCounts = {};

  for (const idText of Object.keys(players)) {
    landCounts[Number(idText)] = 0;
  }

  for (let i = 0; i < owner.length; i++) {
    const id = owner[i];

    if (id === NEUTRAL) continue;
    if (landCounts[id] === undefined) continue;

    landCounts[id]++;
  }

  const rows = [];

  for (const idText of Object.keys(players)) {
    const id = Number(idText);

    if (id === NEUTRAL) continue;

    const cityCount = cities.filter(c => c.owner === id).length;
    const unitCount = units.filter(u => u.owner === id).length;

    const soldierCount = units
      .filter(u => u.owner === id)
      .reduce((sum, u) => sum + u.soldiers, 0);

    const land = landCounts[id] || 0;
    const landPercent = totalLandCells > 0
      ? (land / totalLandCells) * 100
      : 0;

    rows.push({
      id,
      name: players[id].name,
      color: players[id].color,
      land,
      landPercent,
      cities: cityCount,
      units: unitCount,
      soldiers: soldierCount
    });
  }

  rows.sort((a, b) => b.landPercent - a.landPercent);

  leaderboardRows = rows;
}

function drawLeaderboard() {
  if (phase !== "playing") return;

  const rows = leaderboardRows.slice(0, 10);

  const w = 270;
  const h = 34 + rows.length * 24;
  const x = window.innerWidth - w - 16;
  const y = TOP_BAR + 16;

  ctx.fillStyle = "rgba(5, 12, 20, 0.84)";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "white";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Leaderboard", x + 12, y + 20);

  ctx.font = "12px Arial";

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const yy = y + 46 + i * 24;

    ctx.fillStyle = r.color;
    ctx.fillRect(x + 12, yy - 10, 10, 10);

    ctx.fillStyle = "white";
    ctx.fillText(`${i + 1}. ${r.name}`, x + 28, yy);

    ctx.fillStyle = "#dce7f2";
    ctx.fillText(`${r.landPercent.toFixed(1)}%`, x + 145, yy);

    ctx.fillStyle = "#9fb3c8";
    ctx.fillText(`${r.cities}c ${r.units}u`, x + 205, yy);
  }
}

function drawBuildCursor() {
  if (!inBounds(mouseCell.x, mouseCell.y)) return;

  const sx = offsetX + mouseCell.x * cellSize + cellSize / 2;
  const sy = offsetY + mouseCell.y * cellSize + cellSize / 2;

  ctx.strokeStyle = owner[idx(mouseCell.x, mouseCell.y)] === RED
    ? "#ffd34d"
    : "#ff5555";

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
  ctx.fillText("Warmup", window.innerWidth / 2, TOP_BAR + 52);

  ctx.font = "18px Arial";
  ctx.fillText(
    `War starts in ${Math.ceil(warmupTime)}s`,
    window.innerWidth / 2,
    TOP_BAR + 82
  );

  ctx.font = "15px Arial";

  const aiText = blueSpawn
    ? "AI has chosen spawn. Do not choose too close."
    : redSpawn
      ? "AI is still choosing spawn..."
      : "Click any land spot to choose your starting territory.";

  ctx.fillText(aiText, window.innerWidth / 2, TOP_BAR + 112);

  ctx.textAlign = "left";
}

function drawSpawnOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, TOP_BAR, window.innerWidth, window.innerHeight - TOP_BAR);

  ctx.fillStyle = "white";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Warmup", window.innerWidth / 2, TOP_BAR + 52);

  ctx.font = "18px Arial";
  ctx.fillText(
    `War starts in ${Math.ceil(warmupTime)}s`,
    window.innerWidth / 2,
    TOP_BAR + 82
  );

  ctx.font = "15px Arial";
  ctx.fillText(
    `Choose spawn. Bots selected: ${botSpawns.length}/${botCountSetting}`,
    window.innerWidth / 2,
    TOP_BAR + 112
  );

  ctx.textAlign = "left";
}

function drawSpawnMarkers() {
  if (redSpawn) {
    drawSpawnMarker(
      redSpawn.x,
      redSpawn.y,
      players[RED].color,
      "Your spawn"
    );
  }

  for (const spawn of botSpawns) {
    drawSpawnMarker(
      spawn.x,
      spawn.y,
      players[spawn.owner].color,
      players[spawn.owner].name
    );
  }
}

function drawSpawnMarker(x, y, color, label) {
  const sx = offsetX + x * cellSize + cellSize / 2;
  const sy = offsetY + y * cellSize + cellSize / 2;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, 13, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.fillText(label, sx + 15, sy + 4);
}

function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawTopBar();
  drawMap();
  drawSpawnMarkers();
  drawCities();
  drawUnits();
  drawPanel();
  drawLeaderboard();

if (phase === "warmup") drawSpawnOverlay();
if (buildMode) drawBuildCursor();
}