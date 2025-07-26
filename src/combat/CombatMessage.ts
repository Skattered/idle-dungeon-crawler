import { PartyMember, Enemy } from './CombatEngine';

export const generateTacticalMessage = (
  attacker: PartyMember, 
  target: Enemy, 
  damage: number, 
  isCritical: boolean, 
  skillBoost: number
): string => {
  const tacticalContext: Record<string, string> = {
    tank: target.attack >= 15 ? 'focuses on dangerous' : 'engages',
    healer: target.hp <= target.maxHp * 0.3 ? 'finishes off wounded' : 'targets',
    warrior: 'strikes at',
    rogue: target.hp <= target.maxHp * 0.3 ? 'assassinates wounded' : 'strikes',
    mage: target.hp >= target.maxHp * 0.7 ? 'unleashes magic at sturdy' : 'casts spell at'
  };
  
  const action = tacticalContext[attacker.role] || 'attacks';
  const skillText = skillBoost > 1 ? ` (${attacker.skill.name})` : '';
  const critText = isCritical ? ' 💥 CRITICAL!' : '';
  
  return `${attacker.name} ${action} ${target.name} for ${damage} damage!${critText}${skillText}`;
};