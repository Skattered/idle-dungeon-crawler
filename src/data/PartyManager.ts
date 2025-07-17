import { Shield, Heart } from 'lucide-react';
import { dpsClasses, skills } from './GameConfig';

export interface GearItem {
  name: string;
  level: number;
  attack: number;
  defense: number;
  hp: number;
}

export interface Gear {
  weapon: GearItem;
  helm: GearItem;
  chest: GearItem;
  ring1: GearItem;
  ring2: GearItem;
  amulet: GearItem;
  gloves: GearItem;
  bracers: GearItem;
  boots: GearItem;
  pants: GearItem;
}

export interface UpgradeBonus {
  healthBonus: number;
  attackBonus: number;
  defenseBonus: number;
}

export const createDefaultGear = (): Gear => ({
  weapon: { name: 'Basic Weapon', level: 1, attack: 4, defense: 0, hp: 0 },
  helm: { name: 'Basic Helm', level: 1, attack: 0, defense: 2, hp: 5 },
  chest: { name: 'Basic Chestplate', level: 1, attack: 0, defense: 3, hp: 8 },
  ring1: { name: 'Basic Ring', level: 1, attack: 1, defense: 1, hp: 2 },
  ring2: { name: 'Basic Ring', level: 1, attack: 1, defense: 1, hp: 2 },
  amulet: { name: 'Basic Amulet', level: 1, attack: 2, defense: 1, hp: 3 },
  gloves: { name: 'Basic Gloves', level: 1, attack: 1, defense: 1, hp: 2 },
  bracers: { name: 'Basic Bracers', level: 1, attack: 1, defense: 2, hp: 1 },
  boots: { name: 'Basic Boots', level: 1, attack: 0, defense: 2, hp: 3 },
  pants: { name: 'Basic Pants', level: 1, attack: 0, defense: 2, hp: 4 }
});

export const calculateMemberStats = (member: any, upgradeBonus: UpgradeBonus = { healthBonus: 0, attackBonus: 0, defenseBonus: 0 }) => {
  // Validate input parameters to prevent NaN
  if (!member || typeof member !== 'object') {
    console.warn('Invalid member passed to calculateMemberStats:', member);
    return { maxHp: 100, attack: 10, defense: 5 };
  }
  
  // Ensure base stats exist to prevent NaN
  const baseHp = typeof member.baseHp === 'number' && !isNaN(member.baseHp) ? member.baseHp : 
                 typeof member.maxHp === 'number' && !isNaN(member.maxHp) ? member.maxHp : 100;
  const baseAttack = typeof member.baseAttack === 'number' && !isNaN(member.baseAttack) ? member.baseAttack : 
                     typeof member.attack === 'number' && !isNaN(member.attack) ? member.attack : 10;
  const baseDefense = typeof member.baseDefense === 'number' && !isNaN(member.baseDefense) ? member.baseDefense : 
                      typeof member.defense === 'number' && !isNaN(member.defense) ? member.defense : 5;
  
  // Validate upgradeBonus
  const safeUpgradeBonus = {
    healthBonus: typeof upgradeBonus.healthBonus === 'number' && !isNaN(upgradeBonus.healthBonus) ? upgradeBonus.healthBonus : 0,
    attackBonus: typeof upgradeBonus.attackBonus === 'number' && !isNaN(upgradeBonus.attackBonus) ? upgradeBonus.attackBonus : 0,
    defenseBonus: typeof upgradeBonus.defenseBonus === 'number' && !isNaN(upgradeBonus.defenseBonus) ? upgradeBonus.defenseBonus : 0
  };
  
  if (!member.gear) return { 
    maxHp: baseHp + (safeUpgradeBonus.healthBonus * 5), 
    attack: baseAttack + safeUpgradeBonus.attackBonus, 
    defense: baseDefense + safeUpgradeBonus.defenseBonus 
  };
  
  const gearStats = Object.values(member.gear).reduce((total: {attack: number, defense: number, hp: number}, item: any) => {
    // Handle null/undefined gear items or items without full stats
    if (!item || typeof item !== 'object') {
      return total;
    }
    
    return {
      attack: total.attack + ((item.attack || 0) * (item.level || 1)),
      defense: total.defense + ((item.defense || 0) * (item.level || 1)), 
      hp: total.hp + ((item.hp || 0) * (item.level || 1))
    };
  }, { attack: 0, defense: 0, hp: 0 });

  const finalStats = {
    maxHp: baseHp + gearStats.hp + (safeUpgradeBonus.healthBonus * 5),
    attack: baseAttack + gearStats.attack + safeUpgradeBonus.attackBonus,
    defense: baseDefense + gearStats.defense + safeUpgradeBonus.defenseBonus
  };
  
  // Final validation to prevent NaN
  return {
    maxHp: isNaN(finalStats.maxHp) ? 100 : Math.max(1, finalStats.maxHp),
    attack: isNaN(finalStats.attack) ? 10 : Math.max(1, finalStats.attack),
    defense: isNaN(finalStats.defense) ? 5 : Math.max(0, finalStats.defense)
  };
};

export const initializeParty = () => {
  const baseMembersData = [
    { 
      name: "Tank", 
      role: "tank", 
      baseHp: 100, 
      baseAttack: 8, // Reduced from 15 to balance early combat
      baseDefense: 25, 
      gear: createDefaultGear(),
      icon: Shield,
      skill: skills.tank,
      skillCooldown: 0,
      skillActive: false,
      skillDuration: 0
    },
    { 
      name: "Healer", 
      role: "healer", 
      baseHp: 80, 
      baseAttack: 5, // Reduced from 10 to balance early combat
      baseDefense: 15, 
      gear: createDefaultGear(),
      icon: Heart,
      skill: skills.healer,
      skillCooldown: 0,
      skillActive: false,
      skillDuration: 0,
      isProtected: false,
      attackSpeed: 1.2 // 20% faster for more responsive healing
    },
    { 
      name: "Warrior", 
      role: "warrior", 
      dpsClass: "warrior",
      baseHp: dpsClasses.warrior.baseStats.hp, 
      baseAttack: dpsClasses.warrior.baseStats.attack, 
      baseDefense: dpsClasses.warrior.baseStats.defense, 
      gear: createDefaultGear(),
      icon: dpsClasses.warrior.icon,
      skill: skills.warrior,
      skillCooldown: 0,
      skillActive: false,
      skillDuration: 0,
      attackSpeed: dpsClasses.warrior.attackSpeed
    },
    { 
      name: "Rogue", 
      role: "rogue", 
      dpsClass: "rogue",
      baseHp: dpsClasses.rogue.baseStats.hp, 
      baseAttack: dpsClasses.rogue.baseStats.attack, 
      baseDefense: dpsClasses.rogue.baseStats.defense, 
      gear: createDefaultGear(),
      icon: dpsClasses.rogue.icon,
      skill: skills.rogue,
      skillCooldown: 0,
      skillActive: false,
      skillDuration: 0,
      attackSpeed: dpsClasses.rogue.attackSpeed
    },
    { 
      name: "Mage", 
      role: "mage", 
      dpsClass: "mage",
      baseHp: dpsClasses.mage.baseStats.hp, 
      baseAttack: dpsClasses.mage.baseStats.attack, 
      baseDefense: dpsClasses.mage.baseStats.defense, 
      gear: createDefaultGear(),
      icon: dpsClasses.mage.icon,
      skill: skills.mage,
      skillCooldown: 0,
      skillActive: false,
      skillDuration: 0,
      attackSpeed: dpsClasses.mage.attackSpeed
    }
  ];

  return baseMembersData.map(member => {
    const stats = calculateMemberStats(member);
    return {
      ...member,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      attack: stats.attack,
      defense: stats.defense,
      attackTimer: 0
    };
  });
};