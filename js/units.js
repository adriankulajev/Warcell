function createUnit(playerId, x, y, soldiers = TROOP_AMOUNT) {
  const unit = {
    id: nextUnitId++,
    owner: playerId,
    x,
    y,
    soldiers,
    speed: playerId === RED ? 7.0 : 4.8,
    path: [],
    pinned: false
  };

  units.push(unit);
  return unit;
}

function issueMoveOrder(unit, x, y) {
  x = Math.floor(x);
  y = Math.floor(y);

  const startX = Math.floor(unit.x);
  const startY = Math.floor(unit.y);

  const path = findPath(startX, startY, x, y);

  if (path.length === 0) {
    message = "No land path to target.";
    return;
  }

  unit.path = path;
  message = "Move order issued.";
}

function moveUnit(unit, dt) {
  if (unit.pinned) return;
  if (!unit.path || unit.path.length === 0) return;

  const next = unit.path[0];

  const tx = next.x + 0.5;
  const ty = next.y + 0.5;

  const dx = tx - unit.x;
  const dy = ty - unit.y;

  const dist = Math.hypot(dx, dy);

  if (dist < 0.12) {
    unit.x = tx;
    unit.y = ty;
    unit.path.shift();
    return;
  }

  const speed =
    unit.speed *
    terrainSpeed(Math.floor(unit.x), Math.floor(unit.y)) *
    dt;

  const step = Math.min(speed, dist);

  unit.x += (dx / dist) * step;
  unit.y += (dy / dist) * step;
}

function captureAroundUnit(unit, dt) {
  if (unit.pinned) return;

  const ux = Math.floor(unit.x);
  const uy = Math.floor(unit.y);

  const radius = 4;
  const power = unit.soldiers * dt * 0.35;

  for (let y = uy - radius; y <= uy + radius; y++) {
    for (let x = ux - radius; x <= ux + radius; x++) {
      if (!isLand(x, y)) continue;

      const i = idx(x, y);

      if (owner[i] === unit.owner) continue;
      if (!hasNeighborOwner(x, y, unit.owner)) continue;

      const d = Math.hypot(x - unit.x, y - unit.y);
      if (d > radius) continue;

      const enemyBonus = owner[i] === NEUTRAL ? 0.8 : 1.8;
      const defense = terrainDefense(x, y) * enemyBonus;

      control[i] += (power / defense) * (1 - d / (radius + 1));

      if (control[i] > 12) {
  if (owner[i] !== unit.owner) {
    owner[i] = unit.owner;
    ownershipDirty = true;
  }

  control[i] = 0;
}
    }
  }
}

function resolveBattles(dt) {
  for (const unit of units) {
    unit.pinned = false;
  }

  for (let a = 0; a < units.length; a++) {
    for (let b = a + 1; b < units.length; b++) {
      const u1 = units[a];
      const u2 = units[b];

      if (u1.owner === u2.owner) continue;
      if (u1.soldiers <= 0 || u2.soldiers <= 0) continue;

      const d = Math.hypot(u1.x - u2.x, u1.y - u2.y);
      if (d > UNIT_ENGAGE_RANGE) continue;

      u1.pinned = true;
      u2.pinned = true;

      u1.path = [];
      u2.path = [];

      const u1Def = terrainDefense(Math.floor(u1.x), Math.floor(u1.y));
      const u2Def = terrainDefense(Math.floor(u2.x), Math.floor(u2.y));

      const dmgToU2 = UNIT_DAMAGE * dt * (u1.soldiers / 100) / u2Def;
      const dmgToU1 = UNIT_DAMAGE * dt * (u2.soldiers / 100) / u1Def;

      u2.soldiers -= dmgToU2;
      u1.soldiers -= dmgToU1;
    }
  }
}

function removeDeadUnits() {
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].soldiers <= 1) {
      if (selectedUnit === units[i]) {
        selectedUnit = null;
      }

      units.splice(i, 1);
    }
  }
}