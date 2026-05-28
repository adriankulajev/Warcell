const mainMenu = document.getElementById("mainMenu");
const lobbyMenu = document.getElementById("lobbyMenu");

const pauseMenu = document.getElementById("pauseMenu");

const resumeButton = document.getElementById("resumeButton");
const restartMatchButton = document.getElementById("restartMatchButton");
const pauseBackToLobbyButton = document.getElementById("pauseBackToLobbyButton");
const pauseBackToMainButton = document.getElementById("pauseBackToMainButton");

const singleplayerButton = document.getElementById("singleplayerButton");
const backToMainButton = document.getElementById("backToMainButton");

const playerNameInput = document.getElementById("playerNameInput");
const playerColorInput = document.getElementById("playerColorInput");
const playerSlotsList = document.getElementById("playerSlotsList");

const botSlider = document.getElementById("botSlider");
const botCountText = document.getElementById("botCountText");

const warmupSlider = document.getElementById("warmupSlider");
const warmupText = document.getElementById("warmupText");

const startButton = document.getElementById("startButton");

const endMenu = document.getElementById("endMenu");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");

const playAgainButton = document.getElementById("playAgainButton");
const backToLobbyButton = document.getElementById("backToLobbyButton");
const backToMainFromEndButton = document.getElementById("backToMainFromEndButton");

const pauseBorder = document.getElementById("pauseBorder");
const endStats = document.getElementById("endStats");

mainMenu.style.display = "flex";

function showEndMenu(title, text) {
  endResultTitle = title;
  endResultMessage = text;

  endTitle.textContent = title;
  endMessage.textContent = text;

  renderEndStats();

  pauseMenuOpen = false;
  paused = true;

  endMenu.classList.remove("hidden");
}

function hideAllMenus() {
  mainMenu.classList.add("hidden");
  lobbyMenu.classList.add("hidden");
  endMenu.classList.add("hidden");
  pauseMenu.classList.add("hidden");
}

function setGameSpeed(speed) {
  gameSpeed = speed;
  speedButton.textContent = `x${gameSpeed} ▾`;
  speedMenu.classList.add("hidden");
  message = `Game speed set to x${gameSpeed}.`;
}

function syncSpeedControl() {
  if (phase === "playing") {
    speedControl.classList.remove("hidden");
  } else {
    speedControl.classList.add("hidden");
    speedMenu.classList.add("hidden");
  }

  speedButton.textContent = `x${gameSpeed} ▾`;
}

function showPauseMenu() {
  if (phase !== "playing") return;

  pauseMenuOpen = true;
  paused = true;

  pauseMenu.classList.remove("hidden");

  if (typeof speedMenu !== "undefined") {
    speedMenu.classList.add("hidden");
  }
}

function hidePauseMenu() {
  pauseMenuOpen = false;
  paused = false;

  pauseMenu.classList.add("hidden");
}

function returnToLobby() {
  hideAllMenus();

  lobbyMenu.classList.remove("hidden");

  resetGameState(botCountSetting, warmupSetting);

  phase = "menu";
  paused = true;
  message = "Lobby.";
}

function returnToMainMenu() {
  hideAllMenus();

  mainMenu.classList.remove("hidden");

  resetGameState(botCountSetting, warmupSetting);

  phase = "menu";
  paused = true;
  message = "Main menu.";
}

function syncPauseBorder() {
  if (phase === "playing" && paused) {
    pauseBorder.classList.add("active");
  } else {
    pauseBorder.classList.remove("active");
  }
}

function getPlayerEndStats() {
  updateLeaderboardRows();

  const playerRow = leaderboardRows.find(row => row.id === RED);
  const playerRank = leaderboardRows.findIndex(row => row.id === RED) + 1;

  const redCities = cities.filter(c => c.owner === RED).length;
  const redUnits = units.filter(u => u.owner === RED).length;

  const redSoldiers = units
    .filter(u => u.owner === RED)
    .reduce((sum, u) => sum + u.soldiers, 0);

  const aliveBots = botIds.filter(id => {
    const hasCities = cities.some(c => c.owner === id);
    const hasUnits = units.some(u => u.owner === id && u.soldiers > 1);
    return hasCities || hasUnits;
  }).length;

  return {
    time: formatTime(gameTime),
    landPercent: playerRow ? playerRow.landPercent.toFixed(1) : "0.0",
    rank: playerRank > 0 ? playerRank : "-",
    totalPlayers: leaderboardRows.length,
    cities: redCities,
    units: redUnits,
    soldiers: Math.round(redSoldiers),
    botsAlive: aliveBots,
    botsTotal: botCountSetting
  };
}

function renderEndStats() {
  const stats = getPlayerEndStats();

  endStats.innerHTML = `
    <div class="end-stats-row">
      <span class="end-stats-label">Match time</span>
      <span class="end-stats-value">${stats.time}</span>
    </div>

    <div class="end-stats-row">
      <span class="end-stats-label">Your land</span>
      <span class="end-stats-value">${stats.landPercent}%</span>
    </div>

    <div class="end-stats-row">
      <span class="end-stats-label">Rank</span>
      <span class="end-stats-value">#${stats.rank} / ${stats.totalPlayers}</span>
    </div>

    <div class="end-stats-row">
      <span class="end-stats-label">Cities</span>
      <span class="end-stats-value">${stats.cities}</span>
    </div>

    <div class="end-stats-row">
      <span class="end-stats-label">Units</span>
      <span class="end-stats-value">${stats.units}</span>
    </div>

    <div class="end-stats-row">
      <span class="end-stats-label">Soldiers</span>
      <span class="end-stats-value">${stats.soldiers}</span>
    </div>

    <div class="end-stats-row">
      <span class="end-stats-label">Bots alive</span>
      <span class="end-stats-value">${stats.botsAlive} / ${stats.botsTotal}</span>
    </div>
  `;
}

function loadPlayerSettings() {
  const savedName = localStorage.getItem(STORAGE_PLAYER_NAME_KEY);
  const savedColor = localStorage.getItem(STORAGE_PLAYER_COLOR_KEY);
  const savedBotCount = localStorage.getItem(STORAGE_BOT_COUNT_KEY);
  const savedWarmup = localStorage.getItem(STORAGE_WARMUP_KEY);

  if (savedName) {
    playerNameSetting = savedName;
    playerNameInput.value = savedName;
  }

  if (savedColor) {
    playerColorSetting = savedColor;
    playerColorInput.value = savedColor;
  }

  if (savedBotCount) {
    botCountSetting = Number(savedBotCount);
    botSlider.value = botCountSetting;
    botCountText.textContent = botCountSetting;
  }

  if (savedWarmup) {
    warmupSetting = Number(savedWarmup);
    warmupSlider.value = warmupSetting;
    warmupText.textContent = warmupSetting;
  }
}

function savePlayerSettings() {
  localStorage.setItem(STORAGE_PLAYER_NAME_KEY, playerNameSetting);
  localStorage.setItem(STORAGE_PLAYER_COLOR_KEY, playerColorSetting);
  localStorage.setItem(STORAGE_BOT_COUNT_KEY, String(botCountSetting));
  localStorage.setItem(STORAGE_WARMUP_KEY, String(warmupSetting));
}

function getUnitStatus(unit) {
  if (unit.retreating) return "Retreating";
  if (unit.pinned) return "Pinned";
  if (unit.path && unit.path.length > 0) return "Moving";
  return "Idle";
}

function getSelectedUnitStats() {
  const group = selectedUnits.filter(
    unit => unit.owner === RED && unit.soldiers > 0
  );

  const stats = {
    count: group.length,
    soldiers: 0,
    idle: 0,
    moving: 0,
    pinned: 0,
    retreating: 0
  };

  for (const unit of group) {
    stats.soldiers += unit.soldiers;

    const status = getUnitStatus(unit);

    if (status === "Idle") stats.idle++;
    if (status === "Moving") stats.moving++;
    if (status === "Pinned") stats.pinned++;
    if (status === "Retreating") stats.retreating++;
  }

  return stats;
}

function renderLobbySlots() {
  if (!playerSlotsList) return;

  const playerColor = playerColorInput.value || DEFAULT_PLAYER_COLOR;
  const playerName = playerNameInput.value.trim() || DEFAULT_PLAYER_NAME;

  let html = `
    <div class="player-slot">
      <span class="player-slot-dot" style="background:${playerColor}"></span>
      <span class="player-slot-name">P1. ${playerName}</span>
      <span class="player-slot-type">Player</span>
    </div>
  `;

  const previewBots = Math.min(botCountSetting, 12);

  for (let i = 0; i < previewBots; i++) {
    const botName = BOT_NAMES[i % BOT_NAMES.length];
    const botColor = BOT_COLORS[i % BOT_COLORS.length];

    html += `
      <div class="player-slot">
        <span class="player-slot-dot" style="background:${botColor}"></span>
        <span class="player-slot-name">B${i + 1}. ${botName}</span>
        <span class="player-slot-type">Bot</span>
      </div>
    `;
  }

  if (botCountSetting > previewBots) {
    html += `
      <div class="player-slot">
        <span class="player-slot-dot" style="background:#7f93a8"></span>
        <span class="player-slot-name">+${botCountSetting - previewBots} more bots</span>
        <span class="player-slot-type">Hidden</span>
      </div>
    `;
  }

  playerSlotsList.innerHTML = html;
}

speedButton.addEventListener("click", e => {
  e.stopPropagation();
  speedMenu.classList.toggle("hidden");
});

speedMenu.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", e => {
    e.stopPropagation();
    setGameSpeed(Number(button.dataset.speed));
  });
});

singleplayerButton.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  lobbyMenu.classList.remove("hidden");
});

backToMainButton.addEventListener("click", () => {
  lobbyMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
});

window.addEventListener("click", () => {
  speedMenu.classList.add("hidden");
});

botSlider.addEventListener("input", () => {
  botCountSetting = Number(botSlider.value);
  botCountText.textContent = botCountSetting;
  savePlayerSettings();
});

warmupSlider.addEventListener("input", () => {
  warmupSetting = Number(warmupSlider.value);
  warmupText.textContent = warmupSetting;
  savePlayerSettings();
});

startButton.addEventListener("click", () => {
  botCountSetting = Number(botSlider.value);
  warmupSetting = Number(warmupSlider.value);

  playerNameSetting = playerNameInput.value.trim() || DEFAULT_PLAYER_NAME;
  playerColorSetting = playerColorInput.value;

  savePlayerSettings();

  hideAllMenus();

  startWarmup(botCountSetting, warmupSetting);
});

canvas.addEventListener("mousemove", e => {
  mouseCell = screenToCell(e.clientX, e.clientY);

  if (selectionBox.active) {
    selectionBox.endX = e.clientX;
    selectionBox.endY = e.clientY;
  }

  if (formationLine.active) {
    formationLine.endX = e.clientX;
    formationLine.endY = e.clientY;
  }

  if (frontlineOrder.active) {
    frontlineOrder.endX = e.clientX;
    frontlineOrder.endY = e.clientY;
  }
});

canvas.addEventListener("mousedown", e => {
  if (e.button === 2 && e.shiftKey && selectedUnits.length > 0 && phase === "playing") {
    frontlineOrder.active = true;
    frontlineOrder.startX = e.clientX;
    frontlineOrder.startY = e.clientY;
    frontlineOrder.endX = e.clientX;
    frontlineOrder.endY = e.clientY;
    return;
  }

  if (e.button !== 0) return;

  if (e.shiftKey && selectedUnits.length > 0 && phase === "playing") {
    formationLine.active = true;
    formationLine.startX = e.clientX;
    formationLine.startY = e.clientY;
    formationLine.endX = e.clientX;
    formationLine.endY = e.clientY;
    return;
  }

  selectionBox.active = true;
  selectionBox.startX = e.clientX;
  selectionBox.startY = e.clientY;
  selectionBox.endX = e.clientX;
  selectionBox.endY = e.clientY;
  selectionBox.append = false;
});

canvas.addEventListener("mouseup", e => {
  if (e.button === 2 && frontlineOrder.active) {
    const dragDistance = Math.hypot(
      frontlineOrder.endX - frontlineOrder.startX,
      frontlineOrder.endY - frontlineOrder.startY
    );

    const startCell = screenToCell(frontlineOrder.startX, frontlineOrder.startY);
    const endCell = screenToCell(e.clientX, e.clientY);

    frontlineOrder.active = false;

    if (
      inBounds(startCell.x, startCell.y) &&
      inBounds(endCell.x, endCell.y)
    ) {
      if (dragDistance > 8) {
        issueFrontlineOrderFromLine(startCell, endCell);
      } else {
        issueFrontlineOrderFromPoint(endCell);
      }
    }

    return;
  }

  if (e.button !== 0) return;

  // čia lieka tavo senas LMB mouseup kodas

  const cell = screenToCell(e.clientX, e.clientY);

  if (formationLine.active) {
    const dragDistance = Math.hypot(
      formationLine.endX - formationLine.startX,
      formationLine.endY - formationLine.startY
    );

    const wasDraggingLine = dragDistance > 8;

    formationLine.active = false;

    if (wasDraggingLine) {
      const startCell = screenToCell(
        formationLine.startX,
        formationLine.startY
      );

      const endCell = screenToCell(
        e.clientX,
        e.clientY
      );

      if (
        inBounds(startCell.x, startCell.y) &&
        inBounds(endCell.x, endCell.y)
      ) {
        issueFormationLineOrder(startCell, endCell);
      }

      return;
    }

    // If Shift + click without dragging, continue as normal click selection.
  }

  const dragDistance = Math.hypot(
    selectionBox.endX - selectionBox.startX,
    selectionBox.endY - selectionBox.startY
  );

  const wasDragging = dragDistance > 8;
  const append = selectionBox.append;

  selectionBox.active = false;

  if (!inBounds(cell.x, cell.y)) return;

  if (phase === "menu") {
    return;
  }

  if (phase === "warmup") {
    chooseRedSpawn(cell.x, cell.y);
    return;
  }

  if (buildMode) {
    tryBuildCity(cell.x, cell.y);
    return;
  }

  if (wasDragging) {
    selectUnitsInBox({
      startX: selectionBox.startX,
      startY: selectionBox.startY,
      endX: e.clientX,
      endY: e.clientY
    }, append);

    return;
  }

  const clickedUnit = getPlayerUnitAtCell(cell);

  if (clickedUnit) {
    if (e.shiftKey) {
      toggleUnitSelection(clickedUnit);
    } else {
      selectOnlyUnit(clickedUnit);
    }

    message = selectedUnits.length === 1
      ? `Selected unit: ${Math.ceil(clickedUnit.soldiers)} soldiers.`
      : `Selected ${selectedUnits.length} units.`;

    return;
  }

  if (!e.shiftKey) {
    clearUnitSelection();
  }

  const city = nearestCity(cell, 4);

  if (city && city.owner === RED) {
    selectedCity = city;
    message = `Selected ${city.name}. Press T to buy troops.`;
  } else {
    selectedCity = null;
  }
});

canvas.addEventListener("contextmenu", e => {
  e.preventDefault();

  if (frontlineOrder.active || e.shiftKey) {
    return;
  }

  if (phase !== "playing") return;

  const cell = screenToCell(e.clientX, e.clientY);

  if (!inBounds(cell.x, cell.y)) return;
  if (!isLand(cell.x, cell.y)) return;

  if (selectedUnits.some(unit => unit.pinned)) {
    const handledRetreat = issueSelectedRetreatOrder(cell.x, cell.y);

    if (handledRetreat) {
      return;
    }
  }

  if (selectedUnits.length > 0) {
    issueGroupMoveOrder(cell.x, cell.y);
  } else if (selectedUnit) {
    issueMoveOrder(selectedUnit, cell.x, cell.y);
  }
});

window.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (e.code === "Space" && phase === "playing") {
    paused = !paused;
    pauseMenuOpen = false;
    pauseMenu.classList.add("hidden");
  }

  if (e.code === "Escape") {
    if (phase === "playing") {
      if (pauseMenuOpen) {
        hidePauseMenu();
      } else {
        showPauseMenu();
      }
    }

    if (phase === "warmup") {
      returnToLobby();
    }
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

  window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (key === "q" && phase === "playing") {
      splitSelectedUnit();
    }

    // kiti hotkeys...
  });


  if (key === "1") setGameSpeed(0.5);
  if (key === "2") setGameSpeed(1);
  if (key === "3") setGameSpeed(2);
  if (key === "4") setGameSpeed(4);
});

playAgainButton.addEventListener("click", () => {
  hideAllMenus();
  startWarmup(botCountSetting, warmupSetting);
});

backToLobbyButton.addEventListener("click", () => {
  endMenu.classList.add("hidden");
  lobbyMenu.classList.remove("hidden");
  phase = "menu";
});

backToMainFromEndButton.addEventListener("click", () => {
  endMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
  phase = "menu";
});

resumeButton.addEventListener("click", () => {
  hidePauseMenu();
});

restartMatchButton.addEventListener("click", () => {
  hideAllMenus();
  startWarmup(botCountSetting, warmupSetting);
});

pauseBackToLobbyButton.addEventListener("click", () => {
  returnToLobby();
});

pauseBackToMainButton.addEventListener("click", () => {
  returnToMainMenu();
});

playerNameInput.addEventListener("input", () => {
  playerNameSetting = playerNameInput.value.trim() || DEFAULT_PLAYER_NAME;
  savePlayerSettings();
});

playerColorInput.addEventListener("input", () => {
  playerColorSetting = playerColorInput.value;
  savePlayerSettings();
});

singleplayerButton.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  lobbyMenu.classList.remove("hidden");

  renderLobbySlots();
});

loadPlayerSettings();
renderLobbySlots();