const gameHud = document.getElementById("gameHud");

const hudPlayerColor = document.getElementById("hudPlayerColor");
const hudPlayerName = document.getElementById("hudPlayerName");
const hudMoney = document.getElementById("hudMoney");
const hudBotsAlive = document.getElementById("hudBotsAlive");
const hudFps = document.getElementById("hudFps");
const hudTime = document.getElementById("hudTime");
const hudStatus = document.getElementById("hudStatus");

const hudSelectionContent = document.getElementById("hudSelectionContent");
const hudLeaderboardContent = document.getElementById("hudLeaderboardContent");
const hudEventFeed = document.getElementById("hudEventFeed");
const hudMessage = document.getElementById("hudMessage");

const hudBuyTroopsButton = document.getElementById("hudBuyTroopsButton");
const hudBuildCityButton = document.getElementById("hudBuildCityButton");
const hudSplitButton = document.getElementById("hudSplitButton");
const hudRetreatButton = document.getElementById("hudRetreatButton");

let lastHudUpdate = 0;
let lastHudMessage = "";
let hudEvents = [];

function pushHudEvent(text) {
  if (!text) return;

  hudEvents.unshift({
    text,
    time: formatTime(gameTime)
  });

  if (hudEvents.length > 7) {
    hudEvents.pop();
  }
}

function updateHUD() {
  const now = performance.now();

  if (now - lastHudUpdate < 90) {
    return;
  }

  lastHudUpdate = now;

  const showHUD = phase === "warmup" || phase === "playing";

  gameHud.classList.toggle("hidden", !showHUD);

  if (!showHUD) {
    return;
  }

  updateHudTop();
  updateHudSelection();
  updateHudLeaderboard();
  updateHudEvents();
  updateHudActions();
}

function updateHudTop() {
  const player = players[RED];

  hudPlayerColor.style.background = player.color;
  hudPlayerColor.style.color = player.color;
  hudPlayerName.textContent = player.name;
  hudMoney.textContent = Math.floor(player.money);

  const aliveBots = botIds.filter(id =>
    players[id] &&
    !players[id].eliminated
  ).length;

  hudBotsAlive.textContent = `${aliveBots}/${botCountSetting}`;

  hudFps.textContent = fps;
  hudTime.textContent = formatTime(gameTime);

  let statusText = "Menu";
  let statusClass = "";

  if (phase === "warmup") {
    statusText = "Warmup";
    statusClass = "warmup";
  }

  if (phase === "playing") {
    statusText = paused ? "Paused" : "Running";
    statusClass = paused ? "paused" : "running";
  }

  hudStatus.textContent = statusText;
  hudStatus.className = `hud-pill status-pill ${statusClass}`;
}

function updateHudSelection() {
  if (selectedCity) {
    hudSelectionContent.innerHTML = renderSelectedCityHTML(selectedCity);
    return;
  }

  const stats = getSelectedUnitStats();

  if (stats.count > 0) {
    hudSelectionContent.innerHTML = renderSelectedUnitsHTML(stats);
    return;
  }

  hudSelectionContent.innerHTML = `
    <div class="hud-muted">Nothing selected.</div>
    <div style="margin-top: 8px;" class="hud-muted">
      Drag over units or click a city.
    </div>
  `;
}

function renderSelectedCityHTML(city) {
  const ownerName = players[city.owner]?.name || "Unknown";
  const isOwn = city.owner === RED;

  return `
    <div class="hud-selection-row">
      <span class="hud-muted">City</span>
      <span class="hud-strong">${city.name}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Owner</span>
      <span class="hud-strong">${ownerName}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Population</span>
      <span class="hud-strong">${Math.round(city.pop || 0)}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Control</span>
      <span class="${isOwn ? "hud-good" : "hud-danger"}">
        ${isOwn ? "Friendly" : "Enemy"}
      </span>
    </div>
  `;
}

function renderSelectedUnitsHTML(stats) {
  return `
    <div class="hud-selection-row">
      <span class="hud-muted">Units</span>
      <span class="hud-strong">${stats.count}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Soldiers</span>
      <span class="hud-strong">${Math.round(stats.soldiers)}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Idle</span>
      <span>${stats.idle}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Moving</span>
      <span>${stats.moving}</span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Pinned</span>
      <span class="${stats.pinned > 0 ? "hud-danger" : ""}">
        ${stats.pinned}
      </span>
    </div>

    <div class="hud-selection-row">
      <span class="hud-muted">Retreating</span>
      <span class="${stats.retreating > 0 ? "hud-warning" : ""}">
        ${stats.retreating}
      </span>
    </div>
  `;
}

function updateHudLeaderboard() {
  const rows = leaderboardRows.slice(0, 10);

  hudLeaderboardContent.innerHTML = rows.map((row, index) => `
    <div class="hud-leaderboard-row">
      <div class="hud-rank-name">
        <span class="hud-color-square" style="background:${row.color}"></span>
        <span class="hud-player-name-small">
          ${index + 1}. ${row.name}
        </span>
      </div>

      <span class="hud-strong">${row.landPercent.toFixed(1)}%</span>
      <span class="hud-muted">${row.cities}c ${row.units}u</span>
    </div>
  `).join("");
}

function updateHudEvents() {
  if (message && message !== lastHudMessage) {
    lastHudMessage = message;
    pushHudEvent(message);
  }

  hudMessage.textContent = message || "Ready.";

  hudEventFeed.innerHTML = hudEvents.map(event => `
    <div class="hud-event-item">
      <span class="hud-muted">${event.time}</span> ${event.text}
    </div>
  `).join("");
}

function updateHudActions() {
  const hasOwnCity = selectedCity && selectedCity.owner === RED;
  const unitStats = getSelectedUnitStats();

  hudBuyTroopsButton.disabled = !hasOwnCity || players[RED].money < TROOP_COST;
  hudBuildCityButton.disabled = phase !== "playing";
  hudSplitButton.disabled = unitStats.count === 0;
  hudRetreatButton.disabled = unitStats.pinned === 0;
}

hudBuyTroopsButton.addEventListener("click", () => {
  if (typeof buyTroops === "function") {
    buyTroops();
  }
});

hudBuildCityButton.addEventListener("click", () => {
  buildMode = !buildMode;
  message = buildMode
    ? "Build city mode enabled."
    : "Build city mode disabled.";
});

hudSplitButton.addEventListener("click", () => {
  if (typeof splitSelectedUnit === "function") {
    splitSelectedUnit();
  }
});

hudRetreatButton.addEventListener("click", () => {
  message = "Right-click your own territory to retreat pinned units.";
});