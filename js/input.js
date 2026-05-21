const mainMenu = document.getElementById("mainMenu");
const lobbyMenu = document.getElementById("lobbyMenu");

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

mainMenu.style.display = "flex";

function showEndMenu(title, text) {
  endResultTitle = title;
  endResultMessage = text;

  endTitle.textContent = title;
  endMessage.textContent = text;

  endMenu.classList.remove("hidden");
}

function hideAllMenus() {
  mainMenu.classList.add("hidden");
  lobbyMenu.classList.add("hidden");
  endMenu.classList.add("hidden");
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