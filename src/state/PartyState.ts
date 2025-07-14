import { calculateMemberStats, UpgradeBonus } from '../data/PartyManager';

export interface PartyMember {
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackTimer: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  gear: any;
  icon: any;
  skill: any;
  skillCooldown: number;
  skillActive: boolean;
  skillDuration: number;
  dpsClass?: string;
  attackSpeed?: number;
  isProtected?: boolean;
}

export const updatePartyWithUpgrades = (party: PartyMember[], upgrades: UpgradeBonus): PartyMember[] => {
  return party.map(member => {
    const stats = calculateMemberStats(member, upgrades);
    const hpPercentage = member.maxHp > 0 ? member.hp / member.maxHp : 1;
    return {
      ...member,
      maxHp: stats.maxHp,
      hp: Math.round(stats.maxHp * hpPercentage), // Maintain HP percentage
      attack: stats.attack,
      defense: stats.defense
    };
  });
};

export const processSkills = (party: PartyMember[]): { updatedParty: PartyMember[], skillsUsed: any[] } => {
  const newParty = [...party];
  let skillsUsed: any[] = [];

  newParty.forEach((member, index) => {
    if (member.hp <= 0) return; // Dead members can't use skills

    // Decrease cooldown for members who have used skills
    if (member.skillCooldown > 0) {
      newParty[index] = { ...member, skillCooldown: Math.max(0, member.skillCooldown - 100) };
    }

    // Decrease skill duration if active
    if (member.skillActive && member.skillDuration > 0) {
      newParty[index] = { 
        ...newParty[index], 
        skillDuration: member.skillDuration - 1 
      };
      if (member.skillDuration - 1 <= 0) {
        newParty[index] = { ...newParty[index], skillActive: false };
      }
    }

    // Auto-cast skills when off cooldown (for specific skills)
    const skill = member.skill;
    if (member.skillCooldown === 0 && !member.skillActive && skill) {
      let skillUsed = false;

      // Tank skill: Shield Wall - only use when party is taking damage
      if (skill.effect.type === 'damage_reduction') {
        // Use if any party member is below 80% health
        const partyNeedsProtection = newParty.some(m => m.hp > 0 && m.hp / m.maxHp < 0.8);
        if (partyNeedsProtection) {
          newParty[index] = {
            ...newParty[index],
            skillActive: true,
            skillDuration: skill.effect.duration || 1
          };
          skillsUsed.push({ memberName: member.name, skillName: skill.name });
          skillUsed = true;
        }
      }

      // Healer skill: Healing Light - use when someone is injured
      if (skill.effect.type === 'heal') {
        const injuredMember = newParty
          .filter(m => m.hp > 0 && m.hp < m.maxHp)
          .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];

        if (injuredMember && injuredMember.hp / injuredMember.maxHp < 0.7) {
          const healAmount = Math.floor(injuredMember.maxHp * skill.effect.value);
          const targetIndex = newParty.findIndex(m => m.name === injuredMember.name);
          newParty[targetIndex] = {
            ...newParty[targetIndex],
            hp: Math.min(injuredMember.maxHp, injuredMember.hp + healAmount)
          };
          skillsUsed.push({ 
            memberName: member.name, 
            skillName: skill.name, 
            targetName: injuredMember.name, 
            healAmount 
          });
          skillUsed = true;
        }
      }

      // DPS skills: damage boost - prepare for next attack
      if (skill.effect.type === 'damage_boost') {
        newParty[index] = {
          ...newParty[index],
          skillActive: true,
          skillDuration: 1 // Lasts for next attack
        };
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

  return { updatedParty: newParty, skillsUsed };
};