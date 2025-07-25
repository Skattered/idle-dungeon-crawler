import { useCallback } from 'react';
import { useProgressionSystem } from './useProgressionSystem';
import { CombatLogManager } from '../utils/CombatLogManager';

interface UseMassResurrectionParams {
  gameState: { 
    performingMassRes: boolean;
    massResurrectionTimer: number;
    currentFloor: number;
    maxFloorReached: number;
    totalRuns: number;
    runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
    combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
    monstersKilled: number;
    gold: number;
    totalGoldEarned: number;
    gearsFound: number;
    healerProtected: boolean;
  };
  upgrades: {
    goldMultiplier: number;
    gearDropBonus: number;
  };
  setGameState: (updater: (prev: any) => any) => void;
  setParty: (updater: (prev: any[]) => any[]) => void;
}

export const useMassResurrectionRefactored = ({ gameState, upgrades, setGameState, setParty }: UseMassResurrectionParams) => {
  
  const { resetToFloorOne } = useProgressionSystem({
    gameState,
    upgrades,
    setGameState,
    setParty
  });
  
  // Process mass resurrection (called by unified timer)
  const processMassResurrection = useCallback(() => {
    if (!gameState.performingMassRes) return;
    
    setGameState(prevState => {
      const newTimer = prevState.massResurrectionTimer + 100; // 100ms increment
      
      if (newTimer >= 10000) { // 10 seconds completed
        // Use unified progression system for reset
        resetToFloorOne('mass-res-failure');
        
        // Add mass resurrection completion message through CombatLogManager
        CombatLogManager.addMessage({
          text: "✨ Mass Resurrection complete! Party revived at Floor 1.",
          category: 'special',
          timestamp: Date.now()
        });
        
        return {
          ...prevState,
          massResurrectionTimer: 0,
          performingMassRes: false
        };
      }
      
      return {
        ...prevState,
        massResurrectionTimer: newTimer
      };
    });
  }, [gameState.performingMassRes, setGameState, resetToFloorOne]);
  
  return { processMassResurrection };
};