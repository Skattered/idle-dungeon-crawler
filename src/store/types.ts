// Core type definitions for the centralized game store

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed?: number;
  attackTimer?: number;
}

export interface LogMessage {
  text: string;
  category: 'combat' | 'progression' | 'status' | 'skills' | 'special';
  timestamp: number;
  isCritical?: boolean;
}

export interface PartyMember {
  name: string;
  class: string;
  role: 'tank' | 'healer' | 'dps';
  dpsClass?: string;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  baseHp: number;
  attack: number;
  defense: number;
  baseAttack: number;
  baseDefense: number;
  attackTimer: number;
  attackSpeed: number;
  isProtected: boolean;
  skillCooldown: number;
  skillActive: boolean;
  skillDuration?: number;
  icon?: any;
  skill: {
    name?: string;
    effect: {
      type: string;
      value: number;
    };
    cooldown: number;
  };
  gear: {
    weapon: { level: number };
    helm: { level: number };
    chest: { level: number };
    ring1: { level: number };
    ring2: { level: number };
    amulet: { level: number };
    gloves: { level: number };
    bracers: { level: number };
    boots: { level: number };
    pants: { level: number };
  };
}

export interface UpgradeState {
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  goldMultiplier: number;
  gearDropBonus: number;
}

export interface RunHistoryEntry {
  runNumber: number;
  floorReached: number;
  timestamp: number;
}

export interface Formation {
  // Future: party formation/positioning
  positions?: number[];
}

// Core Store State Interface
export interface GameState {
  currentFloor: number;
  maxFloorReached: number;
  currentGroup: number;
  totalGroupsPerFloor: number;
  gameSpeed: number;
  isLoading: boolean;
  lastSaveTime: number;
}

export interface CombatState {
  inCombat: boolean;
  enemies: Enemy[];
  combatLog: LogMessage[];
  shieldWallActive: boolean;
  shieldWallTurns: number;
  performingMassRes: boolean;
  massResurrectionTimer: number;
  healerProtected: boolean;
  enemyAttackTimer: number;
}

export interface EconomyState {
  gold: number;
  totalGoldEarned: number;
  upgrades: UpgradeState;
}

export interface PartyState {
  members: PartyMember[];
  formation: Formation;
}

export interface ProgressionState {
  totalRuns: number;
  monstersKilled: number;
  gearsFound: number;
  runHistory: RunHistoryEntry[];
}

// Store Actions Interface
export interface GameStoreActions {
  // Combat actions
  startCombat: (enemies: Enemy[]) => void;
  endCombat: () => void;
  damageEnemy: (enemyId: string, damage: number) => void;
  completeGroup: () => void;
  updateCombatLog: (message: LogMessage) => void;
  setCombatState: (updates: Partial<CombatState>) => void;
  setEnemies: (enemies: Enemy[]) => void;
  setCombatLog: (combatLog: LogMessage[]) => void;
  setShieldWall: (active: boolean, turns: number) => void;
  setMassResurrection: (active: boolean, timer: number) => void;
  
  // Economy actions
  spendGold: (amount: number) => boolean;
  earnGold: (amount: number) => void;
  purchaseUpgrade: (upgradeType: keyof UpgradeState, cost: number) => boolean;
  setEconomyState: (updates: Partial<EconomyState>) => void;
  setGold: (amount: number) => void;
  setUpgrades: (upgrades: UpgradeState) => void;
  
  // Game actions
  setCurrentFloor: (floor: number) => void;
  setCurrentGroup: (group: number) => void;
  setGameSpeed: (speed: number) => void;
  
  // Progression actions
  setGearsFound: (gears: number) => void;
  setMonstersKilled: (monsters: number) => void;
  incrementMonstersKilled: (amount?: number) => void;
  
  // Party actions
  updatePartyMember: (index: number, updates: Partial<PartyMember>) => void;
  healPartyMember: (index: number, amount: number) => void;
  setPartyState: (updates: Partial<PartyState>) => void;
  
  // Game actions
  setGameSpeed: (speed: number) => void;
  advanceFloor: () => void;
  advanceGroup: () => void;
  resetProgression: () => void;
  setGameState: (updates: Partial<GameState>) => void;
  
  // Progression actions
  addRunToHistory: (run: RunHistoryEntry) => void;
  incrementMonstersKilled: (count?: number) => void;
  incrementGearsFound: (count?: number) => void;
  setProgressionState: (updates: Partial<ProgressionState>) => void;
  
  // Save/Load actions
  saveGame: () => void;
  loadGame: (saveData: any) => void;
}

// Complete Store Interface
export interface GameStore {
  // State
  game: GameState;
  combat: CombatState;
  economy: EconomyState;
  party: PartyState;
  progression: ProgressionState;
  
  // Actions
  actions: GameStoreActions;
}

// Helper type for store subscriptions
export type GameStoreSelector<T> = (state: GameStore) => T;