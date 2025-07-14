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
  if (!member.gear) return { 
    maxHp: member.baseHp + (upgradeBonus.healthBonus * 5), 
    attack: member.baseAttack + upgradeBonus.attackBonus, 
    defense: member.baseDefense + upgradeBonus.defenseBonus 
  };
  
  const gearStats = Object.values(member.gear).reduce((total: {attack: number, defense: number, hp: number}, item: any) => ({
    attack: total.attack + (item.attack * item.level),
    defense: total.defense + (item.defense * item.level), 
    hp: total.hp + (item.hp * item.level)
  }), { attack: 0, defense: 0, hp: 0 });

  return {
    maxHp: member.baseHp + gearStats.hp + (upgradeBonus.healthBonus * 5),
    attack: member.baseAttack + gearStats.attack + upgradeBonus.attackBonus,
    defense: member.baseDefense + gearStats.defense + upgradeBonus.defenseBonus
  };
};

export const initializeParty = () => {
  const baseMembersData = [
    { 
      name: "Tank", 
      role: "tank", 
      baseHp: 100, 
      baseAttack: 15, 
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
      baseAttack: 10, 
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