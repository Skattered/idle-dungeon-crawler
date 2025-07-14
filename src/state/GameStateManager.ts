import { enemyTypes } from '../data/GameConfig';

export interface GameState {
  currentFloor: number;
  maxFloorReached: number;
  currentGroup: number;
  groupsPerFloor: number;
  inCombat: boolean;
  enemies: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    attackSpeed?: number;
    attackTimer?: number;
  }>;
  gold: number;
  experience: number;
  totalRuns: number;
  runHistory: Array<{
    runNumber: number;
    floorReached: number;
    timestamp: number;
  }>;
  performingMassRes: boolean;
  massResurrectionTimer: number;
  healerProtected: boolean;
  globalStatsTracking: {
    gearFound: number;
    monstersKilled: number;
    goldEarned: number;
  };
}

export const generateEnemyGroup = (floor: number, group: number) => {
  const baseHp = 80 + (floor * 8); // Reduced HP scaling
  const baseAttack = 12 + (floor * 2); // Much slower attack scaling
  const baseDefense = 3 + (floor * 1); // Slower defense scaling
  
  const enemyTypeData = [
    { name: "Goblin", multiplier: 1.0, attackSpeed: 1.2 },
    { name: "Orc", multiplier: 1.2, attackSpeed: 1.0 },
    { name: "Troll", multiplier: 1.5, attackSpeed: 0.8 },
    { name: "Dragon", multiplier: 2.0, attackSpeed: 0.6 }
  ];
  
  const enemyType = enemyTypeData[Math.min(Math.floor(floor / 5), enemyTypeData.length - 1)];
  
  // Determine group size (1-5 enemies, weighted toward larger groups)
  const groupSizeWeights = [0.2, 0.25, 0.25, 0.2, 0.1]; // 20% single, 25% pair, 25% trio, 20% quad, 10% quint
  const random = Math.random();
  let groupSize = 1;
  let cumulative = 0;
  for (let i = 0; i < groupSizeWeights.length; i++) {
    cumulative += groupSizeWeights[i];
    if (random <= cumulative) {
      groupSize = i + 1;
      break;
    }
  }
  
  // Generate enemies in the group
  const enemies = [];
  for (let i = 0; i < groupSize; i++) {
    const hp = Math.floor(baseHp * enemyType.multiplier);
    enemies.push({
      id: `${floor}-${group}-${i}`,
      name: `${enemyType.name}${groupSize > 1 ? ` ${i + 1}` : ''}`,
      hp,
      maxHp: hp,
      attack: Math.floor(baseAttack * enemyType.multiplier),
      defense: Math.floor(baseDefense * enemyType.multiplier),
      attackSpeed: enemyType.attackSpeed,
      attackTimer: Math.random() * 50 // Start with random timer offset
    });
  }
  
  return enemies;
};