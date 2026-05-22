function resetGameState(botCount = DEFAULT_BOT_COUNT, warmupSeconds = WARMUP_SECONDS) {
  botCountSetting = Math.max(1, Math.min(MAX_BOTS, botCount));
  warmupSetting = warmupSeconds;

  resetPlayers(botCountSetting);

  botIds = [];
  for (let i = 0; i < botCountSetting; i++) {
    botIds.push(BOT_START_ID + i);
  }

  cities = [];
  units = [];

  selectedCity = null;
  selectedUnit = null;

  gameTime = 0;
  gameSpeed = 1;
  resourceTickTimer = 0;

  warmupTime = warmupSetting;

  redSpawn = null;
  botSpawns = [];
  botSpawnPlans = botIds.map(id => ({
    owner: id,
    chosen: false,
    delay: AI_SPAWN_MIN_DELAY + Math.random() * (AI_SPAWN_MAX_DELAY - AI_SPAWN_MIN_DELAY)
  }));

  paused = false;
  pauseMenuOpen = false;
  buildMode = false;
  gameStarted = false;

  aiOrderTimer = 0;
  aiEcoTimer = 0;

  nextUnitId = 1;
  nextRedCity = 1;
  nextBotCity = 1;

  leaderboardRows = [];
  leaderboardUpdateTimer = 0;

  endResultTitle = "";
  endResultMessage = "";

  ownershipDirty = true;
  terrainDirty = true;

  generateMap();

  message = "Warmup started. Choose your spawn.";
}