function createUnit(playerId, x, y, soldiers = TROOP_AMOUNT) {
  const unit = {
    id: nextUnitId++,
    owner: playerId,
    x,
    y,
    soldiers,
    speed: playerId === RED ? 7.0 : 4.8,
    path: [],
    pinned: false,
    retreating: false,
    retreatTarget: null,
    retreatTimer: 0,
    mergeCooldown: 0
  };

  units.push(unit);
  return unit;
}

function issueMoveOrder(unit, x, y, silent = false) {
  x = Math.floor(x);
  y = Math.floor(y);

  const startX = Math.floor(unit.x);
  const startY = Math.floor(unit.y);

  const path = findPath(startX, startY, x, y);

  if (path.length === 0) {
    if (!silent) {
      message = "No land path to target.";
    }
    return;
  }

  unit.path = path;
  if (!silent) {
    message = "Move order issued.";
  }
}

function finishRetreat(unit) {
  unit.retreating = false;
  unit.retreatTarget = null;
  unit.retreatTimer = 0;
}

function moveUnit(unit, dt) {
  if (unit.retreating && unit.retreatTimer > 0) {
    unit.retreatTimer = Math.max(0, unit.retreatTimer - dt);
    unit.soldiers -= RETREAT_DAMAGE_PER_SECOND * dt;
  }

  if (unit.pinned) return;

  if (!unit.path || unit.path.length === 0) {
    if (unit.retreating) {
      finishRetreat(unit);
    }

    return;
  }

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

    if (unit.path.length === 0 && unit.retreating) {
      finishRetreat(unit);
    }

    return;
  }

  const speedMultiplier = unit.retreating
    ? RETREAT_SPEED_MULTIPLIER
    : 1;

  const speed =
    unit.speed *
    speedMultiplier *
    terrainSpeed(Math.floor(unit.x), Math.floor(unit.y)) *
    dt;

  const step = Math.min(speed, dist);

  unit.x += (dx / dist) * step;
  unit.y += (dy / dist) * step;
}

function captureAroundUnit(unit, dt) {
  if (unit.retreating) return;
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

      const currentOwner = owner[i];

      if (currentOwner === NEUTRAL) {
        if (neutralClaimOwner[i] !== unit.owner) {
          neutralClaimOwner[i] = unit.owner;
          control[i] = 0;
        }
      }

      const enemyBonus = currentOwner === NEUTRAL ? 0.45 : 1.8;
      const defense = terrainDefense(x, y) * enemyBonus;

      control[i] += (power / defense) * (1 - d / (radius + 1));

      const claimThreshold = currentOwner === NEUTRAL
        ? NEUTRAL_CLAIM_THRESHOLD
        : ENEMY_CLAIM_THRESHOLD;

      if (control[i] > claimThreshold) {
        if (owner[i] !== unit.owner) {
          setCellOwner(
            i,
            unit.owner,
            findNearestCityIdForOwner(x, y, unit.owner)
          );
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

      if (u1.retreating || u2.retreating) continue;

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
  selectedUnits = selectedUnits.filter(unit => units.includes(unit));
  selectedUnit = selectedUnits.length > 0
    ? selectedUnits[selectedUnits.length - 1]
    : null;
}

function clearUnitSelection() {
  selectedUnits = [];
  selectedUnit = null;
}

function selectOnlyUnit(unit) {
  selectedUnits = [unit];
  selectedUnit = unit;
  selectedCity = null;
}

function toggleUnitSelection(unit) {
  selectedCity = null;

  const index = selectedUnits.indexOf(unit);

  if (index >= 0) {
    selectedUnits.splice(index, 1);
  } else {
    selectedUnits.push(unit);
  }

  selectedUnit = selectedUnits.length > 0
    ? selectedUnits[selectedUnits.length - 1]
    : null;
}

function isUnitSelected(unit) {
  return selectedUnits.includes(unit);
}

function getPlayerUnitAtCell(cell, radius = 3) {
  let best = null;
  let bestD = radius;

  for (const unit of units) {
    if (unit.owner !== RED) continue;

    const d = Math.hypot(unit.x - cell.x, unit.y - cell.y);

    if (d < bestD) {
      best = unit;
      bestD = d;
    }
  }

  return best;
}

function selectUnitsInBox(box, append = false) {
  const minX = Math.min(box.startX, box.endX);
  const maxX = Math.max(box.startX, box.endX);
  const minY = Math.min(box.startY, box.endY);
  const maxY = Math.max(box.startY, box.endY);

  if (!append) {
    clearUnitSelection();
  }

  for (const unit of units) {
    if (unit.owner !== RED) continue;

    const sx = offsetX + unit.x * cellSize + cellSize / 2;
    const sy = offsetY + unit.y * cellSize + cellSize / 2;

    if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
      if (!selectedUnits.includes(unit)) {
        selectedUnits.push(unit);
      }
    }
  }

  selectedUnit = selectedUnits.length > 0
    ? selectedUnits[selectedUnits.length - 1]
    : null;

  selectedCity = null;

  if (selectedUnits.length > 0) {
    message = `Selected ${selectedUnits.length} units.`;
  }
}

function issueGroupMoveOrder(targetX, targetY) {
  const group = selectedUnits.filter(
    unit => unit.owner === RED && unit.soldiers > 0
  );

  if (group.length === 0) {
    message = "No units selected.";
    return;
  }

  if (group.length === 1) {
    issueMoveOrder(group[0], targetX, targetY);
    return;
  }

  const spacing = 2.2;
  const columns = Math.ceil(Math.sqrt(group.length));

  for (let i = 0; i < group.length; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const ox = (col - (columns - 1) / 2) * spacing;
    const oy = (row - Math.floor(group.length / columns) / 2) * spacing;

    const tx = Math.floor(targetX + ox);
    const ty = Math.floor(targetY + oy);

    const finalTarget = findNearestValidMoveCell(tx, ty, targetX, targetY);

    issueMoveOrder(group[i], finalTarget.x, finalTarget.y, true);
  }

  message = `Move order issued to ${group.length} units.`;
}

function findNearestValidMoveCell(x, y, fallbackX, fallbackY) {
  if (isLand(x, y)) {
    return { x, y };
  }

  for (let r = 1; r <= 5; r++) {
    for (let yy = y - r; yy <= y + r; yy++) {
      for (let xx = x - r; xx <= x + r; xx++) {
        if (isLand(xx, yy)) {
          return { x: xx, y: yy };
        }
      }
    }
  }

  return {
    x: Math.floor(fallbackX),
    y: Math.floor(fallbackY)
  };
}

function splitSelectedUnit() {
  const group = selectedUnits.filter(
    unit => unit.owner === RED && unit.soldiers >= 40
  );

  if (group.length === 0) {
    message = "Select unit with at least 40 soldiers to split.";
    return;
  }

  const newUnits = [];

  for (const unit of group) {
    const splitAmount = Math.floor(unit.soldiers / 2);

    if (splitAmount < 20) continue;

    unit.soldiers -= splitAmount;

    const spawn = findSplitSpawnCell(unit);

    const newUnit = createUnit(
      unit.owner,
      spawn.x,
      spawn.y,
      splitAmount
    );

    unit.mergeCooldown = UNIT_MERGE_COOLDOWN;
    newUnit.mergeCooldown = UNIT_MERGE_COOLDOWN;

    newUnit.path = [];

    newUnits.push(newUnit);
  }

  selectedUnits = [...group, ...newUnits];
  selectedUnit = selectedUnits[selectedUnits.length - 1] || null;
  selectedCity = null;

  message = `Split ${newUnits.length} unit${newUnits.length === 1 ? "" : "s"}.`;
}

function findSplitSpawnCell(unit) {
  const ux = Math.floor(unit.x);
  const uy = Math.floor(unit.y);

  const positions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2]
  ];

  for (const [dx, dy] of positions) {
    const x = ux + dx;
    const y = uy + dy;

    if (!isLand(x, y)) continue;

    return {
      x: x + 0.5,
      y: y + 0.5
    };
  }

  return {
    x: unit.x + 0.8,
    y: unit.y + 0.8
  };
}

function updateMergeCooldowns(dt) {
  for (const unit of units) {
    if (unit.mergeCooldown > 0) {
      unit.mergeCooldown = Math.max(0, unit.mergeCooldown - dt);
    }
  }
}

function autoMergeFriendlyUnits() {
  for (let a = 0; a < units.length; a++) {
    for (let b = a + 1; b < units.length; b++) {
      const u1 = units[a];
      const u2 = units[b];

      if (!u1 || !u2) continue;
      if (u1.owner !== u2.owner) continue;
      if (u1.soldiers <= 0 || u2.soldiers <= 0) continue;
      if (u1.pinned || u2.pinned) continue;
      if (u1.mergeCooldown > 0 || u2.mergeCooldown > 0) continue;

      const d = Math.hypot(u1.x - u2.x, u1.y - u2.y);

      if (d > UNIT_MERGE_RANGE) continue;

      mergeUnits(u1, u2);

      // kad po splice indeksai nesusipjautų
      b--;
    }
  }
}

function mergeUnits(u1, u2) {
  const receiver = u1.soldiers >= u2.soldiers ? u1 : u2;
  const donor = receiver === u1 ? u2 : u1;

  receiver.soldiers += donor.soldiers;
  receiver.mergeCooldown = UNIT_MERGE_COOLDOWN;

  // jei donor turėjo path, bet receiver neturi, perimam path
  if ((!receiver.path || receiver.path.length === 0) && donor.path && donor.path.length > 0) {
    receiver.path = donor.path;
  }

  const donorWasSelected = selectedUnits.includes(donor);
  const receiverWasSelected = selectedUnits.includes(receiver);

  const index = units.indexOf(donor);

  if (index >= 0) {
    units.splice(index, 1);
  }

  selectedUnits = selectedUnits.filter(unit => unit !== donor);

  if ((donorWasSelected || receiverWasSelected) && !selectedUnits.includes(receiver)) {
    selectedUnits.push(receiver);
  }

  selectedUnit = selectedUnits.length > 0
    ? selectedUnits[selectedUnits.length - 1]
    : null;

  if (selectedUnit === donor) {
    selectedUnit = receiver;
  }
}

function issueFormationLineOrder(startCell, endCell) {
  const group = selectedUnits.filter(
    unit => unit.owner === RED && unit.soldiers > 0
  );

  if (group.length === 0) {
    message = "No units selected.";
    return;
  }

  if (!isLand(startCell.x, startCell.y) || !isLand(endCell.x, endCell.y)) {
    message = "Formation line must be on land.";
    return;
  }

  if (group.length === 1) {
    issueMoveOrder(group[0], endCell.x, endCell.y);
    return;
  }

  const dx = endCell.x - startCell.x;
  const dy = endCell.y - startCell.y;
  const lineLength = Math.hypot(dx, dy);

  if (lineLength < 2) {
    issueGroupMoveOrder(endCell.x, endCell.y);
    return;
  }

  for (let i = 0; i < group.length; i++) {
    const t = group.length === 1 ? 0.5 : i / (group.length - 1);

    const tx = Math.floor(startCell.x + dx * t);
    const ty = Math.floor(startCell.y + dy * t);

    const finalTarget = findNearestValidMoveCell(
      tx,
      ty,
      endCell.x,
      endCell.y
    );

    issueMoveOrder(group[i], finalTarget.x, finalTarget.y, true);
  }

  message = `${group.length} units ordered into formation.`;
}

function issueFrontlineOrderFromPoint(cell) {
  const group = selectedUnits.filter(
    unit => unit.owner === RED && unit.soldiers > 0
  );

  if (group.length === 0) {
    message = "No units selected.";
    return;
  }

  const borderCells = findBorderCellsNearPoint(
    cell.x,
    cell.y,
    RED,
    FRONTLINE_CLICK_RADIUS
  );

  if (borderCells.length === 0) {
    message = "No friendly border nearby.";
    return;
  }

  assignUnitsToBorderCells(group, borderCells);

  message = `${group.length} units assigned to frontline.`;
}

function issueFrontlineOrderFromLine(startCell, endCell) {
  const group = selectedUnits.filter(
    unit => unit.owner === RED && unit.soldiers > 0
  );

  if (group.length === 0) {
    message = "No units selected.";
    return;
  }

  const borderCells = findBorderCellsNearLine(
    startCell,
    endCell,
    RED,
    FRONTLINE_LINE_WIDTH
  );

  if (borderCells.length === 0) {
    message = "No friendly border along that line.";
    return;
  }

  assignUnitsToBorderCells(group, borderCells);

  message = `${group.length} units assigned to frontline.`;
}

function findBorderCellsNearPoint(cx, cy, playerId, radius) {
  const cells = [];

  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(MAP_W - 1, Math.floor(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(MAP_H - 1, Math.floor(cy + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!isOwnBorderCell(x, y, playerId)) continue;

      const d = Math.hypot(x - cx, y - cy);
      if (d > radius) continue;

      cells.push({ x, y, score: d });
    }
  }

  cells.sort((a, b) => a.score - b.score);

  return cells;
}

function findBorderCellsNearLine(startCell, endCell, playerId, width) {
  const cells = [];

  const minX = Math.max(0, Math.floor(Math.min(startCell.x, endCell.x) - width));
  const maxX = Math.min(MAP_W - 1, Math.floor(Math.max(startCell.x, endCell.x) + width));
  const minY = Math.max(0, Math.floor(Math.min(startCell.y, endCell.y) - width));
  const maxY = Math.min(MAP_H - 1, Math.floor(Math.max(startCell.y, endCell.y) + width));

  const dx = endCell.x - startCell.x;
  const dy = endCell.y - startCell.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1) {
    return findBorderCellsNearPoint(startCell.x, startCell.y, playerId, FRONTLINE_CLICK_RADIUS);
  }

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!isOwnBorderCell(x, y, playerId)) continue;

      const distance = distanceToSegment(x, y, startCell.x, startCell.y, endCell.x, endCell.y);
      if (distance > width) continue;

      const t = ((x - startCell.x) * dx + (y - startCell.y) * dy) / lenSq;

      cells.push({ x, y, score: t });
    }
  }

  cells.sort((a, b) => a.score - b.score);

  return cells;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const cx = ax + dx * t;
  const cy = ay + dy * t;

  return Math.hypot(px - cx, py - cy);
}

function assignUnitsToBorderCells(group, borderCells) {
  if (borderCells.length === 0) return;

  for (let i = 0; i < group.length; i++) {
    const t = group.length === 1 ? 0.5 : i / (group.length - 1);
    const index = Math.floor(t * (borderCells.length - 1));
    const target = borderCells[index];

    issueMoveOrder(group[i], target.x, target.y, true);
  }
}

function isFriendlyRetreatCell(x, y, playerId) {
  if (!inBounds(x, y)) return false;
  if (!isLand(x, y)) return false;

  return owner[idx(x, y)] === playerId;
}

function issueRetreatOrder(unit, x, y) {
  if (!unit) return false;
  if (unit.owner !== RED) return false;

  if (!unit.pinned) {
    return false;
  }

  x = Math.floor(x);
  y = Math.floor(y);

  if (!isFriendlyRetreatCell(x, y, unit.owner)) {
    return false;
  }

  const startX = Math.floor(unit.x);
  const startY = Math.floor(unit.y);

  const path = findPath(startX, startY, x, y);

  if (path.length === 0) {
    return false;
  }

  unit.path = path;
  unit.pinned = false;
  unit.retreating = true;
  unit.retreatTarget = { x, y };
  unit.retreatTimer = RETREAT_DISENGAGE_TIME;

  return true;
}

function issueSelectedRetreatOrder(x, y) {
  const pinnedUnits = selectedUnits.filter(
    unit => unit.owner === RED && unit.pinned && unit.soldiers > 0
  );

  if (pinnedUnits.length === 0) {
    return false;
  }

  if (!isFriendlyRetreatCell(x, y, RED)) {
    message = "Right-click your own territory to retreat.";
    return true;
  }

  let retreated = 0;

  for (const unit of pinnedUnits) {
    if (issueRetreatOrder(unit, x, y)) {
      retreated++;
    }
  }

  if (retreated > 0) {
    message = `${retreated} unit${retreated === 1 ? "" : "s"} retreating.`;
  } else {
    message = "No retreat path found.";
  }

  return true;
}