import { Sword, Shield, Heart, Target, Flame } from 'lucide-react';

export const gearSlots = ['weapon', 'helm', 'chest', 'ring1', 'ring2', 'amulet', 'gloves', 'bracers', 'boots', 'pants'];

export const dpsClasses = {
  warrior: {
    name: 'Warrior',
    description: 'Heavy melee fighter with high damage and moderate speed',
    icon: Sword,
    baseStats: { hp: 75, attack: 35, defense: 12 },
    attackSpeed: 1.0, // Normal speed
    color: 'red',
    bgGradient: 'from-red-900/20 to-orange-900/20',
    borderColor: 'border-red-500/30'
  },
  rogue: {
    name: 'Rogue',
    description: 'Fast assassin with quick strikes and lower damage',
    icon: Target,
    baseStats: { hp: 65, attack: 25, defense: 8 },
    attackSpeed: 1.4, // 40% faster
    color: 'purple',
    bgGradient: 'from-purple-900/20 to-violet-900/20',
    borderColor: 'border-purple-500/30'
  },
  mage: {
    name: 'Mage',
    description: 'Magical damage dealer with slow but powerful spells',
    icon: Flame,
    baseStats: { hp: 60, attack: 40, defense: 6 },
    attackSpeed: 0.7, // 30% slower
    color: 'blue',
    bgGradient: 'from-blue-900/20 to-cyan-900/20',
    borderColor: 'border-blue-500/30'
  }
};

export const skills = {
  tank: {
    name: 'Shield Wall',
    description: 'Reduces incoming damage to all party members by 50% for 3 turns',
    cooldown: 8000, // 8 seconds
    effect: { type: 'damage_reduction', value: 0.5, duration: 3 }
  },
  healer: {
    name: 'Healing Light',
    description: 'Heals the most injured party member for 50% of their max HP',
    cooldown: 4000, // 4 seconds (improved responsiveness)
    effect: { type: 'heal', value: 0.5 }
  },
  warrior: {
    name: 'Blade Storm',
    description: 'Unleashes a flurry of attacks dealing 180% weapon damage',
    cooldown: 6000, // 6 seconds
    effect: { type: 'damage_boost', value: 1.8 }
  },
  rogue: {
    name: 'Shadow Strike',
    description: 'Quick assassination attempt dealing 150% weapon damage',
    cooldown: 4000, // 4 seconds (faster cooldown)
    effect: { type: 'damage_boost', value: 1.5 }
  },
  mage: {
    name: 'Arcane Blast',
    description: 'Devastating spell dealing 250% weapon damage',
    cooldown: 8000, // 8 seconds (slower cooldown)
    effect: { type: 'damage_boost', value: 2.5 }
  }
};

export const enemyTypes = [
  { name: 'Goblin', icon: '👺' },
  { name: 'Orc', icon: '🧌' },
  { name: 'Skeleton', icon: '💀' },
  { name: 'Troll', icon: '🧌' },
  { name: 'Dragon', icon: '🐉' },
  { name: 'Demon', icon: '👹' },
  { name: 'Lich', icon: '💀' },
  { name: 'Vampire', icon: '🧛' },
  { name: 'Werewolf', icon: '🐺' },
  { name: 'Phoenix', icon: '🔥' }
];