import { useEffect, useRef } from 'react';
import { SaveSystem, SaveData } from '../utils/SaveSystem';
import { isProd } from '../utils/Environment';
import { calculateMemberStats } from '../data/PartyManager';
import { CombatLogManager } from '../utils/CombatLogManager';

interface UseSaveSystemProps {
  gameState: any;
  party: any[];
  upgrades: any;
  setGameState: (gameState: any) => void;
  setParty: (party: any[]) => void;
  setUpgrades: (upgrades: any) => void;
}

export const useSaveSystem = ({
  gameState,
  party,
  upgrades,
  setGameState,
  setParty,
  setUpgrades
}: UseSaveSystemProps) => {
  const hasLoaded = useRef(false);

  // Load game on mount
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const saveData = SaveSystem.loadGame();
    if (saveData) {
      setGameState(prev => ({
        ...prev,
        ...saveData.gameState,
        inCombat: false, // Don't restore combat state
        enemies: []
      }));
      
      // Add load success message through CombatLogManager
      CombatLogManager.addMessage({ 
        text: '💾 Game loaded successfully!', 
        category: 'status', 
        timestamp: Date.now() 
      });
      // Recalculate party stats with current upgrades
      const partyWithRecalculatedStats = saveData.party.map(member => {
        const stats = calculateMemberStats(member, saveData.upgrades);
        return {
          ...member,
          hp: stats.maxHp, // Reset to full health
          maxHp: stats.maxHp,
          attack: stats.attack,
          defense: stats.defense,
          attackTimer: 0 // Reset attack timer
        };
      });
      
      setParty(partyWithRecalculatedStats);
      setUpgrades(saveData.upgrades);
    }
  }, [setGameState, setParty, setUpgrades]);

  // Start autosave in both development and production
  useEffect(() => {
    if (!hasLoaded.current) return;

    SaveSystem.startAutoSave(() => ({
      gameState,
      party,
      upgrades
    }));

    return () => {
      SaveSystem.stopAutoSave();
    };
  }, [gameState, party, upgrades]);

  const exportSave = (): string => {
    return SaveSystem.exportToString(gameState, party, upgrades);
  };

  const importSave = (saveString: string): boolean => {
    const saveData = SaveSystem.importFromString(saveString);
    if (!saveData) return false;

    setGameState(prev => ({
      ...prev,
      ...saveData.gameState,
      inCombat: false,
      enemies: []
    }));
    
    // Add import success message through CombatLogManager
    CombatLogManager.addMessage({ 
      text: '📥 Save imported successfully!', 
      category: 'status', 
      timestamp: Date.now() 
    });
    setParty(saveData.party);
    setUpgrades(saveData.upgrades);
    
    return true;
  };

  const manualSave = (): void => {
    SaveSystem.manualSave(gameState, party, upgrades);
    
    // Add manual save success message through CombatLogManager
    CombatLogManager.addMessage({ 
      text: '💾 Game saved manually!', 
      category: 'status', 
      timestamp: Date.now() 
    });
  };

  return {
    exportSave,
    importSave,
    manualSave
  };
};