function canReceiveCollapsedLand(candidateId, deadId) {
  if (candidateId === NEUTRAL) return false;
  if (candidateId === deadId) return false;
  if (!players[candidateId]) return false;
  if (players[candidateId].eliminated) return false;

  // Later this will check diplomacy:
  // must be at WAR with deadId.
  // For now all active players are treated as war participants.
  return true;
}

function getBestCollapseOwner(x, y, deadId) {
  const counts = {};

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;

    if (!inBounds(nx, ny)) continue;

    const neighborOwner = owner[idx(nx, ny)];

    if (!canReceiveCollapsedLand(neighborOwner, deadId)) continue;

    counts[neighborOwner] = (counts[neighborOwner] || 0) + 1;
  }

  let bestOwner = NEUTRAL;
  let bestCount = 0;

  for (const idText of Object.keys(counts)) {
    const id = Number(idText);

    if (counts[id] > bestCount) {
      bestCount = counts[id];
      bestOwner = id;
    }
  }

  return bestOwner;
}

function collapsePlayerTerritory(deadId) {
  const maxPasses = MAP_W + MAP_H;

  for (let pass = 0; pass < maxPasses; pass++) {
    const changes = [];

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = idx(x, y);

        if (owner[i] !== deadId) continue;

        const newOwner = getBestCollapseOwner(x, y, deadId);

        if (newOwner !== NEUTRAL) {
          changes.push({
            i,
            newOwner
          });
        }
      }
    }

    if (changes.length === 0) break;

    for (const change of changes) {
      owner[change.i] = change.newOwner;
      control[change.i] = 0;
      previousOwner[change.i] = NEUTRAL;
      occupation[change.i] = 0;
    }
  }

  // Anything left without valid war-neighbor becomes neutral.
  for (let i = 0; i < owner.length; i++) {
    if (owner[i] === deadId) {
      owner[i] = NEUTRAL;
      control[i] = 0;
      previousOwner[i] = NEUTRAL;
      occupation[i] = 0;
      cellCity[i] = 0;
    }
  }

  ownershipDirty = true;
}

function removePlayerUnits(playerId) {
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].owner === playerId) {
      if (selectedUnit === units[i]) {
        selectedUnit = null;
      }

      units.splice(i, 1);
    }
  }
}

function eliminatePlayer(playerId) {
  if (playerId === NEUTRAL) return;
  if (!players[playerId]) return;
  if (players[playerId].eliminated) return;

  players[playerId].eliminated = true;

  removePlayerUnits(playerId);
  collapsePlayerTerritory(playerId);
  clearOccupationFromPreviousOwner(playerId);

  if (selectedCity && selectedCity.owner === playerId) {
    selectedCity = null;
  }

  message = `${players[playerId].name} has been eliminated.`;

  updateLeaderboardRows();
}

function checkBotEliminations() {
  if (phase !== "playing") return;

  for (const botId of botIds) {
    if (!players[botId]) continue;
    if (players[botId].eliminated) continue;

    const hasCity = cities.some(city => city.owner === botId);

    if (!hasCity) {
      eliminatePlayer(botId);
    }
  }
}

function clearOccupationFromPreviousOwner(deadId) {
  for (let i = 0; i < owner.length; i++) {
    if (previousOwner[i] === deadId) {
      previousOwner[i] = NEUTRAL;
      occupation[i] = 0;
    }
  }

  ownershipDirty = true;
}