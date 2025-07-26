import { useCallback } from 'react';
import { gearSlots } from '../data/GameConfig';
import { calculateMemberStats } from '../data/PartyManager';
import { CombatLogManager } from '../utils/CombatLogManager';

interface UseGearManagementParams {
  gameState: { gearsFound: number };
  setParty: (updater: (prev: any[]) => any[]) => void;
  setGameState: (updater: (prev: any) => any) => void;
  upgrades: any;
}

export const useGearManagement = ({ gameState, setParty, setGameState, upgrades }: UseGearManagementParams) => {
  const upgradeGear = useCallback(() => {
    if (gameState.gearsFound < 1) return;
    
    setParty(prev => {
      const newParty = [...prev];
      const memberIndex = Math.floor(Math.random() * newParty.length);
      const member = newParty[memberIndex];
      const gearSlot = gearSlots[Math.floor(Math.random() * gearSlots.length)];
      
      // Upgrade the gear piece
      const updatedGear = {
        ...member.gear,
        [gearSlot]: {
          ...member.gear[gearSlot],
          level: member.gear[gearSlot].level + 1
        }
      };
      
      const updatedMember = {
        ...member,
        gear: updatedGear
      };
      
      // Recalculate stats
      const newStats = calculateMemberStats(updatedMember, upgrades);
      const hpIncrease = newStats.maxHp - member.maxHp;
      
      newParty[memberIndex] = {
        ...updatedMember,
        hp: member.hp + hpIncrease,
        maxHp: newStats.maxHp,
        attack: newStats.attack,
        defense: newStats.defense
      };
      
      return newParty;
    });

    setGameState(prev => ({
      ...prev,
      gearsFound: prev.gearsFound - 1
    }));
    
    // Add gear upgrade message through CombatLogManager
    CombatLogManager.addMessage({
      text: "⬆️ Gear upgraded!",
      category: 'rewards',
      timestamp: Date.now()
    });
  }, [gameState.gearsFound, setParty, setGameState, upgrades]);

  return { upgradeGear };
};