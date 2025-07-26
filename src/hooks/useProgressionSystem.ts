import { useCallback } from 'react';
import { CombatLogManager } from '../utils/CombatLogManager';

interface GameState {
  currentFloor: number;
  maxFloorReached: number;
  currentGroup: number;
  totalGroupsPerFloor: number;
  totalRuns: number;
  runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
  combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
  monstersKilled: number;
  gold: number;
  totalGoldEarned: number;
  gearsFound: number;
  healerProtected: boolean;
  massResurrectionTimer: number;
  performingMassRes: boolean;
  inCombat: boolean;
}

interface ProgressionParams {
  gameState: GameState;
  upgrades: {
    goldMultiplier: number;
    gearDropBonus: number;
  };
  setGameState: (updater: (prev: GameState) => GameState) => void;
  setParty: (updater: (prev: any[]) => any[]) => void;
}

export const useProgressionSystem = ({ gameState, upgrades, setGameState, setParty }: ProgressionParams) => {
  
  const resetToFloorOne = useCallback((reason: 'wipe' | 'mass-res-failure') => {
    const logMessage = reason === 'wipe' 
      ? '💀 Party wiped! Starting over...'
      : '💀 Mass Resurrection failed! Starting over...';
      
    setGameState(prev => {
      const newRunHistory = [
        ...prev.runHistory,
        {
          runNumber: prev.totalRuns + 1,
          floorReached: prev.currentFloor,
          timestamp: Date.now()
        }
      ].slice(-10); // Keep only last 10 runs
      
      return {
        ...prev,
        currentFloor: 1,
        currentGroup: 1, // Reset to first group
        totalRuns: prev.totalRuns + 1,
        runHistory: newRunHistory,
        healerProtected: false,
        massResurrectionTimer: 0,
        performingMassRes: false
      };
    });
    
    // Add reset message through CombatLogManager
    CombatLogManager.addMessage({ 
      text: logMessage, 
      category: 'status', 
      timestamp: Date.now() 
    });
    
    // Reset all party members to full health
    setParty(prev => prev.map(member => ({
      ...member,
      hp: member.maxHp,
      attackTimer: 0,
      isProtected: false
    })));
  }, [setGameState, setParty]);

  const advanceProgression = useCallback((_type: 'combat-win') => {
    console.log('advanceProgression called with type:', _type);
    setGameState(prevState => {
      console.log('advanceProgression setting state, current state:', { inCombat: prevState.inCombat, currentGroup: prevState.currentGroup, totalGroups: prevState.totalGroupsPerFloor });
      
      // Prevent duplicate calls - if already out of combat, don't process again
      if (!prevState.inCombat) {
        console.log('Already out of combat, skipping progression');
        return prevState;
      }
      
      const isLastGroup = prevState.currentGroup >= prevState.totalGroupsPerFloor;
      
      if (isLastGroup) {
        // All groups completed, advance to next floor
        const nextFloor = prevState.currentFloor + 1;
        
        // Add floor completion message through CombatLogManager
        CombatLogManager.addMessage({
          text: `🏆 Floor ${prevState.currentFloor} completed! Advancing to Floor ${nextFloor}`,
          category: 'progression',
          timestamp: Date.now()
        });
        
        return {
          ...prevState,
          inCombat: false,
          enemies: [],
          currentFloor: nextFloor,
          currentGroup: 1, // Reset to first group of new floor
          maxFloorReached: Math.max(prevState.maxFloorReached, nextFloor)
        };
      } else {
        // Group completed, advance to next group on same floor
        const nextGroup = prevState.currentGroup + 1;
        
        // Add group completion message through CombatLogManager
        CombatLogManager.addMessage({
          text: `✅ Group ${prevState.currentGroup}/${prevState.totalGroupsPerFloor} completed! Next: Group ${nextGroup}`,
          category: 'progression',
          timestamp: Date.now()
        });
        
        return {
          ...prevState,
          inCombat: false,
          enemies: [],
          currentGroup: nextGroup
        };
      }
    });
  }, [setGameState]);

  return {
    resetToFloorOne,
    advanceProgression
  };
};