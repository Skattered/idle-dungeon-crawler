import { useEffect, useRef } from 'react';

interface UseUnifiedGameTimerParams {
  gameState: {
    inCombat: boolean;
    performingMassRes: boolean;
    massResurrectionTimer: number;
    gearsFound: number;
    enemies: Array<{id: string, name: string, hp: number, maxHp: number, attack: number, defense: number, attackSpeed?: number, attackTimer?: number}>;
  };
  party: Array<{
    hp: number;
    maxHp: number;
    name: string;
    role: string;
    attack: number;
    defense: number;
    attackTimer: number;
    attackSpeed?: number;
    skillActive: boolean;
    skill: { effect: { type: string; value: number } };
    isProtected?: boolean;
  }>;
  upgrades: {
    goldMultiplier: number;
    gearDropBonus: number;
  };
  gameSpeed: number;
  setGameState: (updater: (prev: any) => any) => void;
  setParty: (updater: (prev: any[]) => any[]) => void;
  
  // Game loop callbacks
  processSkills: () => void;
  upgradeGear: () => void;
  startCombat: () => void;
  
  // Attack timer callbacks
  processAttackTimers: (currentGameSpeed: number) => void;
  
  // Game loop callbacks
  processGameLoop: () => void;
  
  // Mass resurrection callbacks
  processMassResurrection: () => void;
}

export const useUnifiedGameTimer = ({
  gameState,
  party,
  upgrades,
  gameSpeed,
  setGameState,
  setParty,
  processSkills,
  upgradeGear,
  startCombat,
  processAttackTimers,
  processGameLoop,
  processMassResurrection
}: UseUnifiedGameTimerParams) => {
  const gameLoopCounterRef = useRef(0);
  const isProcessingRef = useRef(false);
  const gameSpeedRef = useRef(gameSpeed);
  
  // Update game speed ref without restarting timer
  gameSpeedRef.current = gameSpeed;
  
  useEffect(() => {
    // Single unified timer running at 100ms intervals
    const unifiedTimer = setInterval(() => {
      // Prevent concurrent execution
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      try {
        // 1. Process mass resurrection (highest priority)
        if (gameState.performingMassRes) {
          processMassResurrection();
          isProcessingRef.current = false;
          return;
        }
        
        // 2. Process attack timers during combat
        if (gameState.inCombat) {
          processAttackTimers(gameSpeedRef.current);
          // Skills are processed at game loop interval, not attack timer interval
        }
        
        // 3. Process game loop actions (scaled to current gameSpeed)
        gameLoopCounterRef.current += 100;
        if (gameLoopCounterRef.current >= gameSpeedRef.current) {
          gameLoopCounterRef.current = 0;
          processGameLoop();
        }
        
      } finally {
        isProcessingRef.current = false;
      }
    }, 100);
    
    return () => clearInterval(unifiedTimer);
  }, [
    gameState.inCombat,
    gameState.performingMassRes,
    gameState.gearsFound,
    // gameSpeed removed - handled via ref to prevent timer restart
    processSkills,
    processAttackTimers,
    processGameLoop,
    processMassResurrection,
    startCombat,
    upgradeGear
  ]);
};