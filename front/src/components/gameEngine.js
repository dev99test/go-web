import {
  BASE_GOLD,
  BASE_LIFE,
  GRID_HEIGHT,
  GRID_WIDTH,
  PATH_TILES,
  RARITY_TABLE,
  TOWER_TYPES,
  enemyBaseHp,
  enemyBaseSpeed
} from './rt_d_rules';

const PATH_SET = new Set(PATH_TILES.map((p) => `${p[0]},${p[1]}`));

const pickRarity = () => {
  const roll = Math.random();
  let acc = 0;
  for (const entry of RARITY_TABLE) {
    acc += entry.chance;
    if (roll <= acc) return entry;
  }
  return RARITY_TABLE[RARITY_TABLE.length - 1];
};

const randomTowerType = () => {
  const keys = Object.keys(TOWER_TYPES);
  return keys[Math.floor(Math.random() * keys.length)];
};

const createTowerStats = (type, rarity) => {
  const base = TOWER_TYPES[type];
  const multiplier = rarity.multiplier;
  return {
    damage: base.baseDamage * multiplier,
    cooldown: base.cooldown,
    range: base.range,
    splashRadius: base.splashRadius ?? 0,
    slow: base.slow ?? null
  };
};

const findRarityEntry = (name) => RARITY_TABLE.find((r) => r.name === name);

const applyLevelScaling = (stats, level) => {
  if (!level || level <= 1) return stats;
  const bonus = level - 1;
  return {
    ...stats,
    damage: stats.damage * Math.pow(1.12, bonus),
    range: stats.range + 0.1 * bonus
  };
};

const buildTowerStats = (type, rarityName, level) => {
  const rarity = findRarityEntry(rarityName);
  if (!rarity) return null;
  const baseStats = createTowerStats(type, rarity);
  return applyLevelScaling(baseStats, level ?? 1);
};

const nextRarityEntry = (rarityName) => {
  const idx = RARITY_TABLE.findIndex((r) => r.name === rarityName);
  if (idx === -1 || idx === RARITY_TABLE.length - 1) return null;
  return RARITY_TABLE[idx + 1];
};

const createPlayerState = () => ({
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  pathTiles: PATH_TILES,
  life: BASE_LIFE,
  gold: BASE_GOLD,
  wave: 0,
  enemies: [],
  towers: [],
  pendingTower: null,
  selectedTowerId: null,
  spawn: { active: false, remaining: 0, cooldown: 0, wave: 0 },
  nextTowerId: 1,
  nextEnemyId: 1
});

export const initGameState = () => ({
  players: {
    player1: createPlayerState(),
    player2: createPlayerState()
  },
  currentPlayerId: 'player1',
  phase: 'IDLE',
  speed: 1,
  paused: true,
  elapsed: 0
});

export const rollTower = (state, playerId) => {
  const player = state.players[playerId];
  if (!player || player.gold < 10 || player.pendingTower || state.phase === 'GAME_OVER') return state;
  const rarity = pickRarity();
  const type = randomTowerType();
  const stats = buildTowerStats(type, rarity.name, 1);
  const pendingTower = {
    type,
    rarity: rarity.name,
    level: 1,
    invested: 10,
    ...stats,
    cdRemaining: 0
  };
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        gold: player.gold - 10,
        pendingTower
      }
    }
  };
};

export const canPlace = (state, playerId, x, y) => {
  const player = state.players[playerId];
  if (!player) return false;
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return false;
  const key = `${x},${y}`;
  if (PATH_SET.has(key)) return false;
  return !player.towers.some((t) => t.x === x && t.y === y);
};

export const placeTower = (state, playerId, x, y) => {
  const player = state.players[playerId];
  if (!player || !player.pendingTower) return state;
  if (!canPlace(state, playerId, x, y) || state.phase === 'GAME_OVER') return state;
  const tower = {
    ...player.pendingTower,
    x,
    y,
    id: player.nextTowerId
  };
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        towers: [...player.towers, tower],
        pendingTower: null,
        selectedTowerId: tower.id,
        nextTowerId: player.nextTowerId + 1
      }
    }
  };
};

export const startWave = (state, playerId) => {
  const player = state.players[playerId];
  if (!player || player.spawn.active || state.phase === 'GAME_OVER') return state;
  const wave = player.wave + 1;
  return {
    ...state,
    phase: 'PLAYING',
    paused: false,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        wave,
        spawn: { active: true, remaining: 10, cooldown: 0, wave }
      }
    }
  };
};

const getEnemyPosition = (enemy, pathTiles) => {
  const idx = enemy.pathIndex;
  const current = pathTiles[idx];
  const next = pathTiles[idx + 1];
  if (!next) return { x: current[0], y: current[1] };
  const dx = next[0] - current[0];
  const dy = next[1] - current[1];
  return {
    x: current[0] + dx * enemy.pathProgress,
    y: current[1] + dy * enemy.pathProgress
  };
};

const progressValue = (enemy) => enemy.pathIndex + enemy.pathProgress;

const applyDamage = (enemy, dmg) => ({ ...enemy, hp: enemy.hp - dmg });

const attackTarget = (tower, enemies, pathTiles) => {
  const inRange = enemies
    .map((e) => ({ enemy: e, pos: getEnemyPosition(e, pathTiles) }))
    .filter(({ pos }) => {
      const dx = tower.x + 0.5 - (pos.x + 0.5);
      const dy = tower.y + 0.5 - (pos.y + 0.5);
      return Math.hypot(dx, dy) <= tower.range;
    })
    .sort((a, b) => progressValue(b.enemy) - progressValue(a.enemy));

  if (!inRange.length) return { enemies, goldGain: 0 };

  let updated = enemies.map((e) => ({ ...e }));
  const mainTarget = updated.find((e) => e.id === inRange[0].enemy.id);
  const damage = tower.damage;
  if (mainTarget) {
    Object.assign(mainTarget, applyDamage(mainTarget, damage));
  }

  if (tower.splashRadius && tower.splashRadius > 0) {
    for (const { enemy, pos } of inRange.slice(1)) {
      const dx = tower.x + 0.5 - (pos.x + 0.5);
      const dy = tower.y + 0.5 - (pos.y + 0.5);
      if (Math.hypot(dx, dy) <= tower.splashRadius) {
        const target = updated.find((e) => e.id === enemy.id);
        if (target) {
          Object.assign(target, applyDamage(target, damage * 0.6));
        }
      }
    }
  }

  if (tower.slow) {
    const slowed = updated.find((e) => e.id === inRange[0].enemy.id);
    if (slowed) {
      slowed.speedMultiplier = Math.min(slowed.speedMultiplier ?? 1, tower.slow.amount);
      slowed.slowRemaining = Math.max(slowed.slowRemaining ?? 0, tower.slow.duration);
    }
  }

  const alive = updated.filter((e) => e.hp > 0);
  const goldGain = updated.length - alive.length;
  return { enemies: alive, goldGain: goldGain * 2, towerCd: tower.cooldown };
};

const moveEnemy = (enemy, dt, pathTiles) => {
  let remaining = dt;
  let updated = { ...enemy };
  while (remaining > 0) {
    const nextTile = pathTiles[updated.pathIndex + 1];
    if (!nextTile) return { enemy: updated, status: 'arrived' };
    const speed = updated.speed * (updated.speedMultiplier ?? 1);
    const distanceThisStep = speed * remaining;
    const distanceToNext = 1 - updated.pathProgress;
    if (distanceThisStep >= distanceToNext) {
      updated = { ...updated, pathIndex: updated.pathIndex + 1, pathProgress: 0 };
      remaining -= distanceToNext / speed;
      if (!pathTiles[updated.pathIndex + 1]) {
        return { enemy: updated, status: 'arrived' };
      }
    } else {
      updated = { ...updated, pathProgress: updated.pathProgress + distanceThisStep };
      remaining = 0;
    }
  }
  return { enemy: updated, status: 'moving' };
};

const updateEnemySlow = (enemy, dt) => {
  if (!enemy.slowRemaining) return enemy;
  const remaining = Math.max(0, enemy.slowRemaining - dt);
  return {
    ...enemy,
    slowRemaining: remaining,
    speedMultiplier: remaining === 0 ? 1 : enemy.speedMultiplier
  };
};

const tickPlayer = (player, dt) => {
  let gold = player.gold;
  let life = player.life;
  let spawn = { ...player.spawn };
  let enemies = player.enemies.map((e) => ({ ...e }));
  const towers = player.towers.map((t) => ({ ...t }));
  let nextEnemyId = player.nextEnemyId;

  if (spawn.active) {
    spawn.cooldown -= dt;
    while (spawn.remaining > 0 && spawn.cooldown <= 0) {
      const hp = enemyBaseHp(spawn.wave);
      const speed = enemyBaseSpeed(spawn.wave);
      enemies.push({
        id: nextEnemyId++,
        hp,
        maxHp: hp,
        speed,
        speedMultiplier: 1,
        pathIndex: 0,
        pathProgress: 0,
        slowRemaining: 0
      });
      spawn.remaining -= 1;
      spawn.cooldown += 0.6;
    }
    if (spawn.remaining === 0 && spawn.cooldown < 0.01) {
      spawn = { ...spawn, active: false, cooldown: 0 };
    }
  }

  enemies = enemies
    .map((enemy) => moveEnemy(updateEnemySlow(enemy, dt), dt, player.pathTiles))
    .filter(({ status, enemy }) => {
      if (status === 'arrived') {
        life -= 1;
        return false;
      }
      return true;
    })
    .map(({ enemy }) => enemy);

  for (let i = 0; i < towers.length; i += 1) {
    const tower = towers[i];
    const cdRemaining = Math.max(0, (tower.cdRemaining ?? 0) - dt);
    towers[i] = { ...tower, cdRemaining };
    if (cdRemaining <= 0 && enemies.length) {
      const { enemies: nextEnemies, goldGain, towerCd } = attackTarget(tower, enemies, player.pathTiles);
      enemies = nextEnemies;
      gold += goldGain;
      towers[i] = { ...towers[i], cdRemaining: towerCd };
    }
  }

  return {
    ...player,
    gold,
    life,
    enemies,
    towers,
    spawn,
    nextEnemyId
  };
};

export const tickGame = (state, dt) => {
  if (state.phase === 'GAME_OVER') return state;
  if (state.paused) return state;
  const delta = dt * (state.speed ?? 1);
  const nextPlayers = {};
  let gameOver = false;

  for (const [playerId, player] of Object.entries(state.players)) {
    const updated = tickPlayer(player, delta);
    nextPlayers[playerId] = updated;
    if (updated.life <= 0) {
      gameOver = true;
    }
  }

  return {
    ...state,
    players: nextPlayers,
    elapsed: state.elapsed + delta,
    paused: gameOver ? true : state.paused,
    phase: gameOver ? 'GAME_OVER' : state.phase
  };
};

export const upgradeTower = (state, playerId, towerId) => {
  const player = state.players[playerId];
  if (!player || !towerId || state.phase === 'GAME_OVER') return state;
  const idx = player.towers.findIndex((t) => t.id === towerId);
  if (idx === -1) return state;
  const tower = player.towers[idx];
  const cost = 12 * tower.level;
  if (player.gold < cost) return state;
  const upgraded = {
    ...tower,
    level: tower.level + 1,
    invested: tower.invested + cost,
    damage: tower.damage * 1.12,
    range: tower.range + 0.1
  };
  const towers = [...player.towers];
  towers[idx] = upgraded;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        towers,
        gold: player.gold - cost
      }
    }
  };
};

export const sellTower = (state, playerId, towerId) => {
  const player = state.players[playerId];
  if (!player || !towerId || state.phase === 'GAME_OVER') return state;
  const target = player.towers.find((t) => t.id === towerId);
  if (!target) return state;
  const refund = Math.round(target.invested * 0.7);
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        towers: player.towers.filter((t) => t.id !== towerId),
        selectedTowerId: player.selectedTowerId === towerId ? null : player.selectedTowerId,
        gold: player.gold + refund
      }
    }
  };
};

export const mergeTowersByRarity = (state, playerId, sourceTowerId, targetTowerId) => {
  const player = state.players[playerId];
  if (!player) return { nextState: state, error: '플레이어 상태를 찾을 수 없습니다.' };
  if (state.phase === 'GAME_OVER') return { nextState: state, error: '게임 오버 상태에서는 합성할 수 없습니다.' };
  if (!sourceTowerId || !targetTowerId) return { nextState: state, error: '합성할 두 타워를 모두 선택하세요.' };
  if (sourceTowerId === targetTowerId) return { nextState: state, error: '다른 두 타워를 선택해야 합니다.' };

  const source = player.towers.find((t) => t.id === sourceTowerId);
  const target = player.towers.find((t) => t.id === targetTowerId);
  if (!source || !target) return { nextState: state, error: '타워를 찾을 수 없습니다.' };

  const matches = source.type === target.type && source.rarity === target.rarity;
  if (!matches) return { nextState: state, error: '동일 타입/등급의 타워만 합성할 수 있습니다.' };

  const upgradedRarity = nextRarityEntry(source.rarity);
  if (!upgradedRarity) {
    return { nextState: state, error: 'Epic은 더 이상 합성할 수 없습니다.' };
  }

  const stats = buildTowerStats(source.type, upgradedRarity.name, source.level ?? 1);
  if (!stats) return { nextState: state, error: '합성 중 스탯 계산에 실패했습니다.' };

  const merged = {
    ...source,
    id: player.nextTowerId,
    rarity: upgradedRarity.name,
    ...stats,
    invested: (source.invested ?? 0) + (target.invested ?? 0),
    cdRemaining: 0
  };

  const towers = player.towers.filter((t) => t.id !== sourceTowerId && t.id !== targetTowerId);
  towers.push(merged);

  const nextState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        towers,
        selectedTowerId: merged.id,
        nextTowerId: player.nextTowerId + 1
      }
    }
  };

  return { nextState, error: null, message: '합성이 완료되었습니다.' };
};

export const buildEnemySpec = (enemy) => ({
  hp: enemy.hp,
  speed: enemy.speed,
  pathIndex: enemy.pathIndex,
  pathProgress: enemy.pathProgress
});

export const sendEnemyToOpponent = (state, fromPlayerId, enemySpec) => {
  const opponentId = fromPlayerId === 'player1' ? 'player2' : 'player1';
  if (!state.players[opponentId]) return state;
  // TODO: wire this when multiplayer transport is added (e.g., WebSocket)
  return state;
};
