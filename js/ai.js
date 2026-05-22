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

      const target = nearestEnemyCity(unit);

      if (target) {
        issueMoveOrder(unit, target.x, target.y);
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