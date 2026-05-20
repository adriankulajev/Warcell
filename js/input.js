const mainMenu = document.getElementById("mainMenu");
const botSlider = document.getElementById("botSlider");
const botCountText = document.getElementById("botCountText");
const startButton = document.getElementById("startButton");

botSlider.addEventListener("input", () => {
  botCountSetting = Number(botSlider.value);
  botCountText.textContent = botCountSetting;
});

startButton.addEventListener("click", () => {
  botCountSetting = Number(botSlider.value);
  mainMenu.style.display = "none";
  startWarmup(botCountSetting);
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
});