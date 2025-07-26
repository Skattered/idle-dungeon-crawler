import { enemyTypes } from '../data/GameConfig';

export interface GameState {
  currentFloor: number;
  maxFloorReached: number;
  currentGroup: number;
  totalGroupsPerFloor: number;
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

export const generateEnemyGroup = (floor: number, group: number = 1) => {
  // Validate input parameters to prevent "unknown enemy"
  const safeFloor = typeof floor === 'number' && !isNaN(floor) && floor > 0 ? floor : 1;
  const safeGroup = typeof group === 'number' && !isNaN(group) && group > 0 ? group : 1;
  
  // Significantly increased base HP for much slower, more strategic combat
  // Add slight variation per group within the same floor
  const groupVariation = (safeGroup - 1) * 0.1; // 0-40% increase across groups 1-5
  const baseHp = Math.floor((180 + (safeFloor * 25)) * (1 + groupVariation));
  const baseAttack = 3 + (safeFloor * 1);
  const baseDefense = 1 + Math.floor(safeFloor * 0.5);
  
  // Enemy types unlock more gradually with conservative multipliers
  const enemyTypeData = [
    { name: "Goblin", multiplier: 1.0, floorMin: 1 },
    { name: "Orc", multiplier: 1.2, floorMin: 5 },
    { name: "Troll", multiplier: 1.4, floorMin: 10 },
    { name: "Dragon", multiplier: 1.6, floorMin: 20 }
  ];
  
  // Select highest tier enemy available for current floor
  const availableEnemies = enemyTypeData.filter(enemy => safeFloor >= enemy.floorMin);
  const enemyType = availableEnemies.length > 0 ? availableEnemies[availableEnemies.length - 1] : enemyTypeData[0];
  
  // Much more conservative group size progression
  let groupSize;
  if (safeFloor <= 2) {
    groupSize = 1;
  } else if (safeFloor <= 5) {
    groupSize = 2;
  } else if (safeFloor <= 10) {
    groupSize = 3;
  } else if (safeFloor <= 15) {
    groupSize = 4;
  } else {
    groupSize = 5;
  }
  
  // Boss encounters every 5th floor with smaller multiplier
  const isBoss = safeFloor % 5 === 0;
  const bossMultiplier = isBoss ? 1.3 : 1.0;
  
  // Generate enemies in the group
  const enemies = [];
  for (let i = 0; i < groupSize; i++) {
    const finalHp = Math.floor(baseHp * enemyType.multiplier * bossMultiplier);
    const finalAttack = Math.floor(baseAttack * enemyType.multiplier * (isBoss ? 1.2 : 1.0));
    const finalDefense = Math.floor(baseDefense * enemyType.multiplier * bossMultiplier);
    
    const enemyName = isBoss && i === 0 
      ? `${enemyType.name} Boss`
      : `${enemyType.name}${groupSize > 1 ? ` ${i + 1}` : ''}`;
    
    // Validate all enemy stats before creating
    const validatedEnemy = {
      id: `${safeFloor}-${safeGroup}-${i}`,
      name: enemyName || 'Unknown Enemy',
      hp: isNaN(finalHp) ? 100 : Math.max(1, finalHp),
      maxHp: isNaN(finalHp) ? 100 : Math.max(1, finalHp),
      attack: isNaN(finalAttack) ? 10 : Math.max(1, finalAttack),
      defense: isNaN(finalDefense) ? 5 : Math.max(0, finalDefense),
      attackSpeed: 1.0,
      attackTimer: Math.random() * 50
    };
    
    enemies.push(validatedEnemy);
  }
  
  return enemies;
};