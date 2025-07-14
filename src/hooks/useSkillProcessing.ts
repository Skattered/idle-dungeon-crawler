import { useCallback } from 'react';
import { calculateCriticalHit } from '../combat/CriticalHitSystem';

interface SkillUsed {
  text: string;
  isCritical?: boolean;
}

interface PartyMember {
  hp: number;
  maxHp: number;
  role: string;
  isProtected?: boolean;
  skillCooldown: number;
  skillActive: boolean;
  skillDuration?: number;
  skill: {
    effect: {
      type: string;
      value: number;
    };
    cooldown: number;
  };
  name: string;
}

interface UseSkillProcessingParams {
  gameSpeed: number;
  setParty: (updater: (prev: PartyMember[]) => PartyMember[]) => void;
  setGameState: (updater: (prev: any) => any) => void;
}

export const useSkillProcessing = ({ gameSpeed, setParty, setGameState }: UseSkillProcessingParams) => {
  const processSkills = useCallback(() => {
    setParty(prev => {
      const newParty = [...prev];
      let skillsUsed: (string | SkillUsed)[] = [];
      
      newParty.forEach((member, index) => {
        if (member.hp <= 0) return; // Dead members can't cast
        if (member.role === 'healer' && member.isProtected) return; // Protected healer can't cast
        
        // Reduce skill cooldown
        if (member.skillCooldown > 0) {
          newParty[index] = {
            ...member,
            skillCooldown: Math.max(0, member.skillCooldown - gameSpeed)
          };
        }
        
        // Reduce skill duration for active effects
        if (member.skillActive && member.skillDuration && member.skillDuration > 0) {
          const newDuration = member.skillDuration - 1;
          newParty[index] = {
            ...newParty[index],
            skillDuration: newDuration,
            skillActive: newDuration > 0
          };
        }
        
        // Auto-cast skill if off cooldown
        if (member.skillCooldown <= 0 && !member.skillActive) {
          const skill = member.skill;
          let skillUsed = false;
          
          if (skill.effect.type === 'heal') {
            // Find most injured party member
            const injuredMembers = newParty.filter(m => m.hp > 0 && m.hp < m.maxHp);
            
            // Check for emergency healing (members below 30% health)
            const criticalMembers = injuredMembers.filter(m => (m.hp / m.maxHp) < 0.3);
            const membersToConsider = criticalMembers.length > 0 ? criticalMembers : injuredMembers;
            
            if (membersToConsider.length > 0) {
              const mostInjured = membersToConsider.reduce((prev, curr) => 
                (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev
              );
              const baseHealAmount = Math.floor(mostInjured.maxHp * skill.effect.value);
              const { damage: healAmount, isCritical: healCrit } = calculateCriticalHit(baseHealAmount);
              const targetIndex = newParty.findIndex(m => m === mostInjured);
              const hpPercentage = mostInjured.hp / mostInjured.maxHp;
              const isCriticalHeal = hpPercentage <= 0.2 || healCrit; // Below 20% OR crit heal
              
              newParty[targetIndex] = {
                ...newParty[targetIndex],
                hp: Math.min(newParty[targetIndex].maxHp, newParty[targetIndex].hp + healAmount)
              };
              
              const healMessage = `✨ ${member.name} heals ${mostInjured.name} for ${healAmount} HP${healCrit ? ' 💥 CRITICAL!' : ''}`;
              skillsUsed.push({ text: healMessage, isCritical: isCriticalHeal });
              skillUsed = true;
            }
          } else if (skill.effect.type === 'damage_reduction') {
            // Shield Wall effect - handled in game state
            skillsUsed.push(`🛡️ ${member.name} casts Shield Wall!`);
            skillUsed = true;
          } else if (skill.effect.type === 'damage_boost') {
            // Power Strike - will be handled in combat
            newParty[index] = {
              ...newParty[index],
              skillActive: true,
              skillDuration: 1 // Lasts for next attack
            };
            // Don't add prepare message to combat log
            skillUsed = true;
          }
          
          // Only set cooldown if skill was actually used
          if (skillUsed) {
            newParty[index] = {
              ...newParty[index],
              skillCooldown: skill.cooldown
            };
          }
        }
      });
      
      // Update combat log with skill usage
      if (skillsUsed.length > 0) {
        setGameState(prevState => ({
          ...prevState,
          combatLog: [...prevState.combatLog, ...skillsUsed.map(skill => ({ 
            text: typeof skill === 'string' ? skill : skill.text, 
            category: 'skills', 
            timestamp: Date.now(),
            isCritical: typeof skill === 'object' ? skill.isCritical : false
          }))].slice(-3000),
          shieldWallActive: skillsUsed.some(msg => {
            const text = typeof msg === 'string' ? msg : msg.text;
            return text.includes('Shield Wall');
          }),
          shieldWallTurns: skillsUsed.some(msg => {
            const text = typeof msg === 'string' ? msg : msg.text;
            return text.includes('Shield Wall');
          }) ? 3 : prevState.shieldWallTurns
        }));
      }
      
      return newParty;
    });
  }, [gameSpeed, setParty, setGameState]);

  return { processSkills };
};