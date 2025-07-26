import { Sword, HardHat, Shirt, Crown, Gem, Hand, Watch, Footprints, Users } from 'lucide-react';

export const getHealthBarColor = (hp: number, maxHp: number): string => {
  const percentage = hp / maxHp;
  if (percentage > 0.6) return 'bg-green-500';
  if (percentage > 0.3) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getGearIcon = (gearType: string) => {
  switch (gearType) {
    case 'weapon': return Sword;
    case 'helm': return HardHat;
    case 'chest': return Shirt;
    case 'ring1': return Crown;
    case 'ring2': return Crown;
    case 'amulet': return Gem;
    case 'gloves': return Hand;
    case 'bracers': return Watch;
    case 'boots': return Footprints;
    case 'pants': return Users;
    default: return Gem;
  }
};

