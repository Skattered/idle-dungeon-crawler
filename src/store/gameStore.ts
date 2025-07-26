import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  GameStore, 
  GameState, 
  CombatState, 
  EconomyState, 
  PartyState, 
  ProgressionState,
  LogMessage,
  Enemy,
  PartyMember,
  UpgradeState,
  RunHistoryEntry
} from './types';

// Initial state values
const initialGameState: GameState = {
  currentFloor: 1,
  maxFloorReached: 1,
  currentGroup: 1,
  totalGroupsPerFloor: 5,
  gameSpeed: 1000,
  isLoading: false,
  lastSaveTime: 0,
};

const initialCombatState: CombatState = {
  inCombat: false,
  enemies: [],
  combatLog: [],
  shieldWallActive: false,
  shieldWallTurns: 0,
  performingMassRes: false,
  massResurrectionTimer: 0,
  healerProtected: false,
  enemyAttackTimer: 0,
};

const initialEconomyState: EconomyState = {
  gold: 0,
  totalGoldEarned: 0,
  upgrades: {
    attackBonus: 0,
    defenseBonus: 0,
    healthBonus: 0,
    goldMultiplier: 1,
    gearDropBonus: 0,
  },
};

const initialPartyState: PartyState = {
  members: [],
  formation: {},
};

const initialProgressionState: ProgressionState = {
  totalRuns: 0,
  monstersKilled: 0,
  gearsFound: 0,
  runHistory: [],
};

// Create the store
export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // State
      game: initialGameState,
      combat: initialCombatState,
      economy: initialEconomyState,
      party: initialPartyState,
      progression: initialProgressionState,
      
      // Actions
      actions: {
        // Combat actions
        startCombat: (enemies: Enemy[]) => set((state) => ({
          combat: {
            ...state.combat,
            inCombat: true,
            enemies,
          }
        }), false, 'combat/start'),
        
        endCombat: () => set((state) => ({
          combat: {
            ...state.combat,
            inCombat: false,
            enemies: [],
          }
        }), false, 'combat/end'),
        
        damageEnemy: (enemyId: string, damage: number) => {
          const state = get();
          const enemy = state.combat.enemies.find(e => e.id === enemyId);
          if (!enemy) return;
          
          const newHp = Math.max(0, enemy.hp - damage);
          const wasAlive = enemy.hp > 0;
          const isNowDead = newHp === 0;
          
          // Update enemy HP
          set((state) => ({
            combat: {
              ...state.combat,
              enemies: state.combat.enemies.map(e => 
                e.id === enemyId 
                  ? { ...e, hp: newHp }
                  : e
              ),
            }
          }), false, 'combat/damageEnemy');
          
          // Handle drops and rewards if enemy just died
          if (wasAlive && isNowDead) {
            // Calculate base gold drop using current floor as level
            const baseGold = Math.floor(Math.random() * 11) + 5; // 5-15
            const floorMultiplier = Math.max(1, state.game.currentFloor);
            const goldDrop = Math.floor(baseGold * floorMultiplier * state.economy.upgrades.goldMultiplier);
            
            // Award gold
            if (goldDrop > 0) {
              set((state) => ({
                economy: {
                  ...state.economy,
                  gold: state.economy.gold + goldDrop,
                  totalGoldEarned: state.economy.totalGoldEarned + goldDrop,
                }
              }), false, 'combat/goldDrop');
            }
            
            // Increment monsters killed
            set((state) => ({
              progression: {
                ...state.progression,
                monstersKilled: state.progression.monstersKilled + 1,
              }
            }), false, 'combat/monsterKilled');
            
            // Check for gear drop (10% base chance + gear drop bonus)
            const gearDropChance = 0.1 + (state.economy.upgrades.gearDropBonus * 0.05); // 5% per bonus level
            if (Math.random() < gearDropChance) {
              set((state) => ({
                progression: {
                  ...state.progression,
                  gearsFound: state.progression.gearsFound + 1,
                }
              }), false, 'combat/gearDrop');
            }
          }
        },
        
        completeGroup: () => {
          const state = get();
          const isLastGroup = state.game.currentGroup >= state.game.totalGroupsPerFloor;
          
          if (isLastGroup) {
            // Advance to next floor
            const nextFloor = state.game.currentFloor + 1;
            
            set((state) => ({
              game: {
                ...state.game,
                currentFloor: nextFloor,
                maxFloorReached: Math.max(state.game.maxFloorReached, nextFloor),
                currentGroup: 1, // Reset to first group of new floor
              },
              combat: {
                ...state.combat,
                inCombat: false,
                enemies: [],
              }
            }), false, 'combat/completeFloor');
          } else {
            // Advance to next group
            const nextGroup = state.game.currentGroup + 1;
            
            set((state) => ({
              game: {
                ...state.game,
                currentGroup: nextGroup,
              },
              combat: {
                ...state.combat,
                inCombat: false,
                enemies: [],
              }
            }), false, 'combat/completeGroup');
          }
        },
        
        updateCombatLog: (message: LogMessage) => set((state) => ({
          combat: {
            ...state.combat,
            combatLog: [...state.combat.combatLog, message].slice(-3000), // Keep last 3000 messages
          }
        }), false, 'combat/updateLog'),
        
        setCombatState: (updates: Partial<CombatState>) => set((state) => ({
          combat: {
            ...state.combat,
            ...updates,
          }
        }), false, 'combat/setState'),
        
        setEnemies: (enemies: Enemy[]) => set((state) => ({
          combat: {
            ...state.combat,
            enemies,
          }
        }), false, 'combat/setEnemies'),
        
        setCombatLog: (combatLog: LogMessage[]) => set((state) => ({
          combat: {
            ...state.combat,
            combatLog,
          }
        }), false, 'combat/setCombatLog'),
        
        setShieldWall: (active: boolean, turns: number) => set((state) => ({
          combat: {
            ...state.combat,
            shieldWallActive: active,
            shieldWallTurns: turns,
          }
        }), false, 'combat/setShieldWall'),
        
        setMassResurrection: (active: boolean, timer: number) => set((state) => ({
          combat: {
            ...state.combat,
            performingMassRes: active,
            massResurrectionTimer: timer,
          }
        }), false, 'combat/setMassResurrection'),
        
        // Economy actions
        spendGold: (amount: number) => {
          const state = get();
          if (state.economy.gold >= amount) {
            set((state) => ({
              economy: {
                ...state.economy,
                gold: state.economy.gold - amount,
              }
            }), false, 'economy/spendGold');
            return true;
          }
          return false;
        },
        
        earnGold: (amount: number) => set((state) => ({
          economy: {
            ...state.economy,
            gold: state.economy.gold + amount,
            totalGoldEarned: state.economy.totalGoldEarned + amount,
          }
        }), false, 'economy/earnGold'),
        
        purchaseUpgrade: (upgradeType: keyof UpgradeState, cost: number) => {
          const state = get();
          
          if (state.economy.gold >= cost) {
            set((state) => ({
              economy: {
                ...state.economy,
                gold: state.economy.gold - cost,
                upgrades: {
                  ...state.economy.upgrades,
                  [upgradeType]: state.economy.upgrades[upgradeType] + 1,
                },
              }
            }), false, `economy/purchaseUpgrade/${upgradeType}`);
            return true;
          }
          return false;
        },
        
        setEconomyState: (updates: Partial<EconomyState>) => set((state) => ({
          economy: {
            ...state.economy,
            ...updates,
          }
        }), false, 'economy/setState'),
        
        setGold: (amount: number) => set((state) => ({
          economy: {
            ...state.economy,
            gold: amount,
          }
        }), false, 'economy/setGold'),
        
        setUpgrades: (upgrades: UpgradeState) => set((state) => ({
          economy: {
            ...state.economy,
            upgrades,
          }
        }), false, 'economy/setUpgrades'),
        
        // Game actions
        setCurrentFloor: (floor: number) => set((state) => ({
          game: {
            ...state.game,
            currentFloor: floor,
          }
        }), false, 'game/setCurrentFloor'),
        
        setCurrentGroup: (group: number) => set((state) => ({
          game: {
            ...state.game,
            currentGroup: group,
          }
        }), false, 'game/setCurrentGroup'),
        
        setGameSpeed: (speed: number) => set((state) => ({
          game: {
            ...state.game,
            gameSpeed: speed,
          }
        }), false, 'game/setGameSpeed'),
        
        // Progression actions
        setGearsFound: (gears: number) => set((state) => ({
          progression: {
            ...state.progression,
            gearsFound: gears,
          }
        }), false, 'progression/setGearsFound'),
        
        setMonstersKilled: (monsters: number) => set((state) => ({
          progression: {
            ...state.progression,
            monstersKilled: monsters,
          }
        }), false, 'progression/setMonstersKilled'),
        
        incrementMonstersKilled: (amount: number = 1) => set((state) => ({
          progression: {
            ...state.progression,
            monstersKilled: state.progression.monstersKilled + amount,
          }
        }), false, 'progression/incrementMonstersKilled'),
        
        // Party actions
        updatePartyMember: (index: number, updates: Partial<PartyMember>) => set((state) => ({
          party: {
            ...state.party,
            members: state.party.members.map((member, i) => 
              i === index ? { ...member, ...updates } : member
            ),
          }
        }), false, `party/updateMember/${index}`),
        
        healPartyMember: (index: number, amount: number) => set((state) => ({
          party: {
            ...state.party,
            members: state.party.members.map((member, i) => 
              i === index ? { 
                ...member, 
                hp: Math.min(member.maxHp, member.hp + amount) 
              } : member
            ),
          }
        }), false, `party/healMember/${index}`),
        
        setPartyState: (updates: Partial<PartyState>) => set((state) => ({
          party: {
            ...state.party,
            ...updates,
          }
        }), false, 'party/setState'),
        advanceFloor: () => set((state) => ({
          game: {
            ...state.game,
            currentFloor: state.game.currentFloor + 1,
            maxFloorReached: Math.max(state.game.maxFloorReached, state.game.currentFloor + 1),
            currentGroup: 1, // Reset to first group
          }
        }), false, 'game/advanceFloor'),
        
        advanceGroup: () => set((state) => ({
          game: {
            ...state.game,
            currentGroup: state.game.currentGroup + 1,
          }
        }), false, 'game/advanceGroup'),
        
        resetProgression: () => set((state) => ({
          game: {
            ...state.game,
            currentFloor: 1,
            currentGroup: 1,
          },
          progression: {
            ...state.progression,
            totalRuns: state.progression.totalRuns + 1,
          }
        }), false, 'game/resetProgression'),
        
        setGameState: (updates: Partial<GameState>) => set((state) => ({
          game: {
            ...state.game,
            ...updates,
          }
        }), false, 'game/setState'),
        
        // Progression actions
        addRunToHistory: (run: RunHistoryEntry) => set((state) => ({
          progression: {
            ...state.progression,
            runHistory: [...state.progression.runHistory, run].slice(-10), // Keep last 10 runs
          }
        }), false, 'progression/addRun'),
        incrementGearsFound: (count = 1) => set((state) => ({
          progression: {
            ...state.progression,
            gearsFound: state.progression.gearsFound + count,
          }
        }), false, 'progression/incrementGears'),
        
        setProgressionState: (updates: Partial<ProgressionState>) => set((state) => ({
          progression: {
            ...state.progression,
            ...updates,
          }
        }), false, 'progression/setState'),
        
        // Save/Load actions (placeholder)
        saveGame: () => {
          // TODO: Implement save game logic
          console.log('Save game action called');
          const state = get();
          set((state) => ({
            game: {
              ...state.game,
              lastSaveTime: Date.now(),
            }
          }), false, 'game/save');
        },
        
        loadGame: (saveData: any) => {
          // TODO: Implement load game logic
          console.log('Load game action called', saveData);
          set((state) => ({
            game: {
              ...state.game,
              isLoading: true,
            }
          }), false, 'game/load');
        },
      },
    }),
    {
      name: 'game-store',
      serialize: {
        options: {
          // Don't serialize actions in devtools
          filter: (name, value) => !name.startsWith('actions'),
        },
      },
    }
  )
);

// Selector hooks for common use cases
export const useGameState = () => useGameStore((state) => state.game);
export const useCombatState = () => useGameStore((state) => state.combat);
export const useEconomyState = () => useGameStore((state) => state.economy);
export const usePartyState = () => useGameStore((state) => state.party);
export const useProgressionState = () => useGameStore((state) => state.progression);
export const useGameActions = () => useGameStore((state) => state.actions);

// Derived state selectors
export const useCanAffordUpgrade = (upgradeType: keyof UpgradeState, cost: number) => 
  useGameStore((state) => state.economy.gold >= cost);

export const useIsInCombat = () => useGameStore((state) => state.combat.inCombat);

export const useCurrentFloorInfo = () => useGameStore((state) => ({
  currentFloor: state.game.currentFloor,
  currentGroup: state.game.currentGroup,
  totalGroups: state.game.totalGroupsPerFloor,
}));