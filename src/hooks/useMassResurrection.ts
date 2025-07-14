import { useEffect } from 'react';

interface UseMassResurrectionParams {
  gameState: { 
    performingMassRes: boolean;
    massResurrectionTimer: number;
    currentFloor: number;
    totalRuns: number;
    runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
    combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
  };
  setGameState: (updater: (prev: any) => any) => void;
  setParty: (updater: (prev: any[]) => any[]) => void;
}

export const useMassResurrection = ({ gameState, setGameState, setParty }: UseMassResurrectionParams) => {
  useEffect(() => {
    if (!gameState.performingMassRes) return;
    
    const massResInterval = setInterval(() => {
      setGameState(prevState => {
        const newTimer = prevState.massResurrectionTimer + 100; // 100ms increment
        
        if (newTimer >= 10000) { // 10 seconds completed
          // Complete mass resurrection
          setParty(prev => prev.map(member => ({
            ...member,
            hp: member.maxHp,
            attackTimer: 0,
            isProtected: false // Remove healer protection
          })));
          
          const newRunHistory = [
            ...prevState.runHistory,
            {
              runNumber: prevState.totalRuns + 1,
              floorReached: prevState.currentFloor,
              timestamp: Date.now()
            }
          ].slice(-10); // Keep only last 10 runs
          
          return {
            ...prevState,
            inCombat: false,
            enemies: [],
            currentGroup: 1,
            currentFloor: 1, // Reset to floor 1
            totalRuns: prevState.totalRuns + 1,
            runHistory: newRunHistory,
            healerProtected: false,
            massResurrectionTimer: 0,
            performingMassRes: false,
            combatLog: [...prevState.combatLog, 
              { text: "✨ Mass Resurrection complete! Party revived at Floor 1.", category: 'special', timestamp: Date.now() }
            ].slice(-3000)
          };
        }
        
        return {
          ...prevState,
          massResurrectionTimer: newTimer
        };
      });
    }, 100);
    
    return () => clearInterval(massResInterval);
  }, [gameState.performingMassRes, setGameState, setParty]);
};