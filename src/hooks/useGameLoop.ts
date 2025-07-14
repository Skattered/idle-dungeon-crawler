import { useEffect } from 'react';

interface UseGameLoopParams {
  gameState: { inCombat: boolean; gearsFound: number };
  gameSpeed: number;
  processSkills: () => void;
  upgradeGear: () => void;
  startCombat: () => void;
}

export const useGameLoop = ({ 
  gameState, 
  gameSpeed, 
  processSkills, 
  upgradeGear, 
  startCombat 
}: UseGameLoopParams) => {
  useEffect(() => {
    const gameLoop = setInterval(() => {
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
    }, gameSpeed);

    return () => clearInterval(gameLoop);
  }, [gameState.inCombat, processSkills, startCombat, upgradeGear, gameSpeed]);
};