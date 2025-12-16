export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 8;

export const PATH_TILES = [
  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
  [5, 4], [5, 5], [6, 5], [7, 5], [8, 5],
  [8, 4], [8, 3], [8, 2], [9, 2], [10, 2], [11, 2]
];

export const TOWER_TYPES = {
  Arrow: {
    baseDamage: 6,
    cooldown: 0.45,
    range: 3.2
  },
  Cannon: {
    baseDamage: 14,
    cooldown: 1.2,
    range: 3.0,
    splashRadius: 1.0
  },
  Frost: {
    baseDamage: 3,
    cooldown: 0.6,
    range: 3.0,
    slow: { amount: 0.7, duration: 2.0 }
  }
};

export const RARITY_TABLE = [
  { name: 'Common', chance: 0.7, multiplier: 1.0 },
  { name: 'Rare', chance: 0.25, multiplier: 1.35 },
  { name: 'Epic', chance: 0.05, multiplier: 1.8 }
];

const BASE_GOLD = 30;
const BASE_LIFE = 20;

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
    slow: base.slow
  };
};

export const initGame = () => ({
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
  running: false,
  paused: true,
  gameOver: false,
  speed: 1,
  elapsed: 0,
  nextTowerId: 1,
  nextEnemyId: 1
});

export const rollTower = () => {
  const rarity = pickRarity();
  const type = randomTowerType();
  const stats = createTowerStats(type, rarity);
  return {
    type,
    rarity: rarity.name,
    level: 1,
    invested: 10,
    ...stats,
    cdRemaining: 0
  };
};

export const canPlace = (state, x, y) => {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return false;
  const key = `${x},${y}`;
  const pathSet = new Set(PATH_TILES.map((p) => `${p[0]},${p[1]}`));
  if (pathSet.has(key)) return false;
  return !state.towers.some((t) => t.x === x && t.y === y);
};

export const startNextWave = (state) => {
  if (state.spawn.active || state.gameOver) return state;
  const wave = state.wave + 1;
  return {
    ...state,
    wave,
    spawn: { active: true, remaining: 10, cooldown: 0, wave },
    running: true,
    paused: false
  };
};

const enemyBaseHp = (wave) => 30 + wave * 12;
const enemyBaseSpeed = (wave) => 1.2 + wave * 0.03;

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

const applyDamage = (enemy, dmg) => {
  enemy.hp -= dmg;
};

const updateEnemySlow = (enemy, dt) => {
  if (enemy.slowRemaining) {
    enemy.slowRemaining = Math.max(0, enemy.slowRemaining - dt);
    if (enemy.slowRemaining === 0) {
      enemy.speedMultiplier = 1;
    }
  }
};

const moveEnemy = (enemy, dt, pathTiles) => {
  let remaining = dt;
  while (remaining > 0) {
    const nextTile = pathTiles[enemy.pathIndex + 1];
    if (!nextTile) return 'arrived';
    const speed = enemy.speed * (enemy.speedMultiplier ?? 1);
    const distanceThisStep = speed * remaining;
    const distanceToNext = 1 - enemy.pathProgress;
    if (distanceThisStep >= distanceToNext) {
      enemy.pathIndex += 1;
      enemy.pathProgress = 0;
      remaining -= distanceToNext / speed;
      if (!pathTiles[enemy.pathIndex + 1]) {
        return 'arrived';
      }
    } else {
      enemy.pathProgress += distanceThisStep;
      remaining = 0;
    }
  }
  return 'moving';
};

const attackTarget = (tower, enemies, pathTiles) => {
  const inRange = enemies
    .map((e) => ({ enemy: e, pos: getEnemyPosition(e, pathTiles) }))
    .filter(({ pos }) => {
      const dx = tower.x + 0.5 - (pos.x + 0.5);
      const dy = tower.y + 0.5 - (pos.y + 0.5);
      return Math.hypot(dx, dy) <= tower.range;
    })
    .sort((a, b) => progressValue(b.enemy) - progressValue(a.enemy));

  if (!inRange.length) return { enemies, gained: 0 };

  const { enemy: target } = inRange[0];
  const damage = tower.damage;
  const updatedEnemies = enemies.map((e) => ({ ...e }));
  const main = updatedEnemies.find((e) => e.id === target.id);
  applyDamage(main, damage);

  if (tower.splashRadius && tower.splashRadius > 0) {
    for (const { enemy, pos } of inRange.slice(1)) {
      const dx = tower.x + 0.5 - (pos.x + 0.5);
      const dy = tower.y + 0.5 - (pos.y + 0.5);
      if (Math.hypot(dx, dy) <= tower.splashRadius) {
        const splashTarget = updatedEnemies.find((e) => e.id === enemy.id);
        applyDamage(splashTarget, damage * 0.6);
      }
    }
  }

  if (tower.slow) {
    const t = updatedEnemies.find((e) => e.id === target.id);
    if (t) {
      t.speedMultiplier = Math.min(t.speedMultiplier ?? 1, tower.slow.amount);
      t.slowRemaining = Math.max(t.slowRemaining ?? 0, tower.slow.duration);
    }
  }

  tower.cdRemaining = tower.cooldown;
  const aliveEnemies = updatedEnemies.filter((e) => e.hp > 0);
  const killed = updatedEnemies.length - aliveEnemies.length;
  const gained = killed * 2;
  return { enemies: aliveEnemies, gained };
};

export const tick = (state, dt) => {
  if (state.paused || state.gameOver) return state;
  const delta = dt * state.speed;
  let nextState = { ...state, elapsed: state.elapsed + delta };
  let enemies = state.enemies.map((e) => ({ ...e }));
  let towers = state.towers.map((t) => ({ ...t }));
  let life = state.life;
  let gold = state.gold;
  let spawn = { ...state.spawn };

  if (spawn.active) {
    spawn.cooldown -= delta;
    while (spawn.remaining > 0 && spawn.cooldown <= 0) {
      const hp = enemyBaseHp(spawn.wave);
      const speed = enemyBaseSpeed(spawn.wave);
      enemies.push({
        id: nextState.nextEnemyId++,
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
      spawn.active = false;
      spawn.cooldown = 0;
    }
  }

  enemies = enemies
    .map((enemy) => {
      const e = { ...enemy };
      updateEnemySlow(e, delta);
      const status = moveEnemy(e, delta, state.pathTiles);
      return { enemy: e, status };
    })
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
    tower.cdRemaining = Math.max(0, tower.cdRemaining - delta);
    if (tower.cdRemaining <= 0 && enemies.length) {
      const result = attackTarget(tower, enemies, state.pathTiles);
      enemies = result.enemies;
      gold += result.gained;
    }
  }

  nextState = {
    ...nextState,
    enemies,
    towers,
    life,
    gold,
    spawn
  };

  return canMoveOrGameOver(nextState);
};

export const canMoveOrGameOver = (state) => {
  if (state.life <= 0) {
    return {
      ...state,
      life: 0,
      gameOver: true,
      paused: true,
      running: false,
      spawn: { ...state.spawn, active: false }
    };
  }
  return state;
};
