import { useCallback } from 'react';

interface UseGameLoopParams {
  gameState: { inCombat: boolean; gearsFound: number };
  processSkills: () => void;
  upgradeGear: () => void;
  startCombat: () => void;
}

export const useGameLoopRefactored = ({ 
  gameState, 
  processSkills, 
  upgradeGear, 
  startCombat 
}: UseGameLoopParams) => {
  
  // Process game loop actions (called by unified timer when gameSpeed interval is reached)
  const processGameLoop = useCallback(() => {
    if (gameState.inCombat) {
      processSkills();
      // processCombat() replaced by individual attack system
    } else {
      // Auto-upgrade gear if available
      if (gameState.gearsFound > 0) {
        upgradeGear();
      }
      
      // Add a brief delay before starting next combat to allow UI to update
      setTimeout(() => {
        startCombat();
      }, 500); // 500ms delay to show group progression
    }
  }, [gameState.inCombat, gameState.gearsFound, processSkills, startCombat, upgradeGear]);
  
  return { processGameLoop };
};