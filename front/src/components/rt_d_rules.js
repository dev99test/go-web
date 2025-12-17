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
  { name: 'Rare', chance: 0.23, multiplier: 1.35 },
  { name: 'Epic', chance: 0.055, multiplier: 1.8 },
  { name: 'Unique', chance: 0.012, multiplier: 2.4 },
  { name: 'Legendary', chance: 0.0025, multiplier: 3.2 },
  { name: 'Mythic', chance: 0.0005, multiplier: 4.2 }
];

export const BASE_GOLD = 30;
export const BASE_LIFE = 20;

export const MERGE_DAMAGE_MULT = 1.35;
export const MERGE_RANGE_BONUS = 0.15;

export const enemyBaseHp = (wave) => 30 + wave * 12;
export const enemyBaseSpeed = (wave) => 1.2 + wave * 0.03;
