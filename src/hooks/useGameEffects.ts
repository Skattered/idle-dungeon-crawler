import { useEffect, useCallback } from 'react';
import { generateEnemyGroup } from '../state/GameStateManager';
import { processSkills } from '../state/PartyState';

interface PartyMember {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackTimer: number;
  attackSpeed?: number;
  skillActive?: boolean;
  skill?: any;
  skillDuration?: number;
  isProtected?: boolean;
  gear?: any;
}

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed?: number;
}

interface GameState {
  inCombat: boolean;
  enemies: Enemy[];
  currentFloor: number;
  currentGroup: number;
  groupsPerFloor: number;
  performingMassRes: boolean;
  massResurrectionTimer: number;
  enemyAttackTimer: number;
  attackTimer: number;
  totalRuns: number;
  runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
  healerProtected: boolean;
  combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
  gold: number;
  totalGoldEarned: number;
  gearsFound: number;
  monstersKilled: number;
}

interface GameEffectsHookProps {
  gameState: GameState;
  party: PartyMember[];
  gameSpeed: number;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  setParty: (updater: (prev: PartyMember[]) => PartyMember[]) => void;
  startCombat: () => void;
  upgradeGear: () => void;
}

export const useGameEffects = ({
  gameState,
  party,
  gameSpeed,
  setGameState,
  setParty,
  startCombat,
  upgradeGear
}: GameEffectsHookProps) => {

  // Process skills function
  const processSkillsWrapper = useCallback(() => {
    processSkills(party, setParty, setGameState, gameState);
  }, [party, setParty, setGameState, gameState]);

  // Mass resurrection timer
  useEffect(() => {
    if (!gameState.performingMassRes) return;

    const massResInterval = setInterval(() => {
      setGameState(prevState => {
        const newTimer = prevState.massResurrectionTimer + 100; // 100ms increment
        
        if (newTimer >= 10000) { // 10 seconds completed
          // Complete mass resurrection
          return {
            ...prevState,
            performingMassRes: false,
            massResurrectionTimer: 0,
            healerProtected: false,
            combatLog: [...prevState.combatLog, { text: "✨ Mass Resurrection complete! All party members revived!", category: 'special', timestamp: Date.now() }].slice(-3000)
          };
        } else {
          return {
            ...prevState,
            massResurrectionTimer: newTimer
          };
        }
      });
      
      // Revive party members when mass resurrection completes
      if (gameState.massResurrectionTimer + 100 >= 10000) {
        setParty(prevParty => prevParty.map(member => ({
          ...member,
          hp: member.role === 'healer' ? member.hp : member.maxHp, // Don't heal the healer who was already alive
          attackTimer: 0,
          isProtected: false // Remove healer protection after mass res
        })));
      }
    }, 100);

    return () => clearInterval(massResInterval);
  }, [gameState.performingMassRes, gameState.massResurrectionTimer, setGameState, setParty]);

  // Main game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameState.inCombat) {
        processSkillsWrapper();
        // processCombat() replaced by individual attack system
      } else {
        // Auto-upgrade gear if available
        upgradeGear();
        
        // Auto-start combat with a delay for player to see results
        setTimeout(() => {
          startCombat();
        }, 1000);
      }
    }, gameSpeed);

    return () => clearInterval(gameLoop);
  }, [gameState.inCombat, processSkillsWrapper, startCombat, upgradeGear, gameSpeed]);

  // Combat initiation effect
  const initiateCombat = useCallback(() => {
    if (!gameState.inCombat && gameState.enemies.length === 0) {
      const newEnemies = generateEnemyGroup(gameState.currentFloor, gameState.currentGroup);
      setGameState(prev => ({
        ...prev,
        inCombat: true,
        enemies: newEnemies,
        attackTimer: 0, // Reset attack timer
        enemyAttackTimer: 0, // Reset enemy attack timer
        combatLog: [...prev.combatLog, { text: `⚔️ Encountered ${newEnemies.length} enemies on Floor ${prev.currentFloor}, Group ${prev.currentGroup}!`, category: 'progression', timestamp: Date.now() }].slice(-3000)
      }));
    }
  }, [gameState.inCombat, gameState.enemies.length, gameState.currentFloor, gameState.currentGroup, setGameState]);

  return {
    initiateCombat,
    processSkillsWrapper
  };
};