function findNeutralExpansionTarget(unit, searchRadius = AI_NEUTRAL_SEARCH_RADIUS) {
  let best = null;
  let bestScore = Infinity;

  const ux = Math.floor(unit.x);
  const uy = Math.floor(unit.y);

  const minX = Math.max(0, ux - searchRadius);
  const maxX = Math.min(MAP_W - 1, ux + searchRadius);

  const minY = Math.max(0, uy - searchRadius);
  const maxY = Math.min(MAP_H - 1, uy + searchRadius);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!isLand(x, y)) continue;

      const i = idx(x, y);

      if (owner[i] !== NEUTRAL) continue;
      if (!hasNeighborOwner(x, y, unit.owner)) continue;

      const d = Math.hypot(x - unit.x, y - unit.y);

      if (d > searchRadius) continue;

      const score = d + Math.random() * 4;

      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }

  return best;
}

function updateAI(dt) {
  aiOrderTimer += dt;
  aiEcoTimer += dt;

  if (aiOrderTimer >= 4) {
    aiOrderTimer = 0;

    for (const unit of units) {
      if (unit.owner === RED || unit.owner === NEUTRAL) continue;
      if (!players[unit.owner]) continue;
      if (players[unit.owner].eliminated) continue;
      if (unit.pinned) continue;
      if (unit.path.length > 0) continue;

      const neutralTarget = findNeutralExpansionTarget(unit);

      if (neutralTarget && Math.random() < AI_NEUTRAL_PRIORITY_CHANCE) {
        issueMoveOrder(unit, neutralTarget.x, neutralTarget.y, true);
        continue;
      }

      const enemyTarget = nearestEnemyCity(unit);

      if (enemyTarget) {
        issueMoveOrder(unit, enemyTarget.x, enemyTarget.y, true);
      }
    }
  }

  if (aiEcoTimer >= 5) {
    aiEcoTimer = 0;

    for (const botId of botIds) {
      if (!players[botId]) continue;
      if (players[botId].eliminated) continue;

      const botCities = cities.filter(c => c.owner === botId);

      if (botCities.length === 0) continue;

      if (players[botId].money >= TROOP_COST) {
        const city = botCities[Math.floor(Math.random() * botCities.length)];

        players[botId].money -= TROOP_COST;

        createUnit(
          botId,
          city.x - 2,
          city.y + 1,
          TROOP_AMOUNT
        );
      }

      if (players[botId].money >= CITY_BUILD_COST + 40 && Math.random() < 0.25) {
        const spot = findOwnedBuildSpot(botId);

        if (spot) {
          players[botId].money -= CITY_BUILD_COST;

          createCity(
            `${players[botId].name} City ${nextBotCity++}`,
            spot.x,
            spot.y,
            botId,
            2600
          );
        }
      }
    }
  }
}