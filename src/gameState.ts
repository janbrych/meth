export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  coins: number;
  direction: 'down' | 'up' | 'left' | 'right';
  isAttacking: boolean;
  attackAnimTimer: number;
  skin: string;
  weapon: {
    id: string;
    name: string;
    damage: number;
    range: number;
    icon: string;
  };
}

export interface EnemyState {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
  isNightOnly: boolean;
  coinsReward: number;
}

export interface WorldTime {
  day: number;
  hour: number;
  minute: number;
  tickCounter: number;
  isNight: boolean;
}

export interface FurnitureItem {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
}

export interface FarmPlot {
  id: string;
  x: number;
  y: number;
  type: 'wheat' | 'berry' | 'water_well';
  name: string;
  icon: string;
  readyForHarvest: boolean;
}

export class GameState {
  player: PlayerState;
  enemies: EnemyState[];
  worldTime: WorldTime;
  placedFurniture: FurnitureItem[];
  placedFarms: FarmPlot[];
  inventory: { [itemId: string]: number };
  equippedSkin: string;

  houseBounds = {
    x: 800,
    y: 800,
    width: 400,
    height: 300
  };

  mapSize = {
    width: 2000,
    height: 2000
  };

  constructor() {
    this.player = {
      x: 1000,
      y: 950,
      width: 32,
      height: 32,
      speed: 3.5,
      hp: 100,
      maxHp: 100,
      hunger: 100,
      maxHunger: 100,
      thirst: 100,
      maxThirst: 100,
      coins: 50,
      direction: 'down',
      isAttacking: false,
      attackAnimTimer: 0,
      skin: '🧙‍♂️ Kouzelník',
      weapon: {
        id: 'sword_basic',
        name: 'Dřevěný Meč',
        damage: 1,
        range: 45,
        icon: '🗡️'
      }
    };

    this.enemies = [];
    this.placedFurniture = [
      { id: 'bed', name: 'Postel', icon: '🛏️', x: 840, y: 840 },
      { id: 'table', name: 'Stůl', icon: '🪑', x: 920, y: 840 }
    ];
    this.placedFarms = [];
    this.inventory = {};
    this.equippedSkin = '🧙‍♂️ Kouzelník';

    this.worldTime = {
      day: 1,
      hour: 8,
      minute: 0,
      tickCounter: 0,
      isNight: false
    };

    this.spawnInitialEnemies();
  }

  spawnInitialEnemies() {
    const types = [
      { type: 'slime', name: 'Slizoun', hp: 1, difficulty: 'easy' as const, color: '#2ecc71', isNightOnly: false, reward: 15 },
      { type: 'goblin', name: 'Skřet', hp: 2, difficulty: 'medium' as const, color: '#e67e22', isNightOnly: false, reward: 30 }
    ];

    for (let i = 0; i < 8; i++) {
      const t = types[i % types.length];
      const pos = this.getRandomMapPosOutsideHouse();
      this.enemies.push({
        id: Math.random().toString(),
        type: t.type,
        name: t.name,
        x: pos.x,
        y: pos.y,
        width: 32,
        height: 32,
        speed: 1.2 + Math.random() * 0.8,
        hp: t.hp,
        maxHp: t.hp,
        difficulty: t.difficulty,
        color: t.color,
        isNightOnly: t.isNightOnly,
        coinsReward: t.reward
      });
    }
  }

  spawnNightMonsters() {
    const nightTypes = [
      { type: 'demon', name: 'Noční Démon', hp: 3, difficulty: 'hard' as const, color: '#8e44ad', isNightOnly: true, reward: 50 },
      { type: 'boss_goblin', name: 'Skřetí Válečník', hp: 2, difficulty: 'medium' as const, color: '#c0392b', isNightOnly: true, reward: 35 }
    ];

    for (let i = 0; i < 6; i++) {
      const t = nightTypes[i % nightTypes.length];
      const pos = this.getRandomMapPosOutsideHouse();
      this.enemies.push({
        id: Math.random().toString(),
        type: t.type,
        name: t.name,
        x: pos.x,
        y: pos.y,
        width: 36,
        height: 36,
        speed: 1.8 + Math.random() * 0.5,
        hp: t.hp,
        maxHp: t.hp,
        difficulty: t.difficulty,
        color: t.color,
        isNightOnly: t.isNightOnly,
        coinsReward: t.reward
      });
    }
  }

  getRandomMapPosOutsideHouse(): { x: number, y: number } {
    let x = 0, y = 0;
    let safe = false;
    while (!safe) {
      x = Math.random() * (this.mapSize.width - 100) + 50;
      y = Math.random() * (this.mapSize.height - 100) + 50;

      const inHouse = (
        x >= this.houseBounds.x - 50 &&
        x <= this.houseBounds.x + this.houseBounds.width + 50 &&
        y >= this.houseBounds.y - 50 &&
        y <= this.houseBounds.y + this.houseBounds.height + 50
      );

      if (!inHouse) {
        safe = true;
      }
    }
    return { x, y };
  }

  isInsideHouse(x: number, y: number): boolean {
    return (
      x >= this.houseBounds.x &&
      x <= this.houseBounds.x + this.houseBounds.width &&
      y >= this.houseBounds.y &&
      y <= this.houseBounds.y + this.houseBounds.height
    );
  }

  updateTime() {
    this.worldTime.tickCounter++;
    if (this.worldTime.tickCounter >= 20) {
      this.worldTime.tickCounter = 0;
      this.worldTime.minute++;
      if (this.worldTime.minute >= 60) {
        this.worldTime.minute = 0;
        this.worldTime.hour++;
        if (this.worldTime.hour >= 24) {
          this.worldTime.hour = 0;
          this.worldTime.day++;
          this.onNewDay();
        }
      }
    }

    const wasNight = this.worldTime.isNight;
    this.worldTime.isNight = this.worldTime.hour >= 20 || this.worldTime.hour < 6;

    if (!wasNight && this.worldTime.isNight) {
      this.spawnNightMonsters();
    }
  }

  onNewDay() {
    for (const farm of this.placedFarms) {
      farm.readyForHarvest = true;
    }
  }

  updateSurvival() {
    if (this.worldTime.tickCounter % 30 === 0) {
      this.player.hunger = Math.max(0, this.player.hunger - 0.1);
      this.player.thirst = Math.max(0, this.player.thirst - 0.15);

      if (this.player.hunger === 0 || this.player.thirst === 0) {
        this.player.hp = Math.max(0, this.player.hp - 1);
      }
    }
  }
}
