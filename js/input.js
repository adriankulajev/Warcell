const mainMenu = document.getElementById("mainMenu");
const lobbyMenu = document.getElementById("lobbyMenu");

const pauseMenu = document.getElementById("pauseMenu");

const resumeButton = document.getElementById("resumeButton");
const restartMatchButton = document.getElementById("restartMatchButton");
const pauseBackToLobbyButton = document.getElementById("pauseBackToLobbyButton");
const pauseBackToMainButton = document.getElementById("pauseBackToMainButton");

const singleplayerButton = document.getElementById("singleplayerButton");
const backToMainButton = document.getElementById("backToMainButton");

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
});

warmupSlider.addEventListener("input", () => {
  warmupSetting = Number(warmupSlider.value);
  warmupText.textContent = warmupSetting;
});

startButton.addEventListener("click", () => {
  botCountSetting = Number(botSlider.value);
  warmupSetting = Number(warmupSlider.value);

  mainMenu.classList.add("hidden");
  lobbyMenu.classList.add("hidden");

  startWarmup(botCountSetting, warmupSetting);
});

canvas.addEventListener("mousemove", e => {
  mouseCell = screenToCell(e.clientX, e.clientY);
});

canvas.addEventListener("click", e => {
  const cell = screenToCell(e.clientX, e.clientY);

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