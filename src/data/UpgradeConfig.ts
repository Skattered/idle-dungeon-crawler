export interface Upgrade {
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
}

export const upgradeShop: Record<string, Upgrade> = {
  attackBonus: {
    name: 'Attack Training',
    description: '+1 Attack for all party members',
    baseCost: 50,
    costMultiplier: 1.5
  },
  defenseBonus: {
    name: 'Defense Training', 
    description: '+1 Defense for all party members',
    baseCost: 50,
    costMultiplier: 1.5
  },
  healthBonus: {
    name: 'Health Training',
    description: '+5 Max HP for all party members',
    baseCost: 40,
    costMultiplier: 1.4
  },
  goldMultiplier: {
    name: 'Treasure Hunter',
    description: '+10% gold earned from combat',
    baseCost: 100,
    costMultiplier: 2.0
  },
  gearDropBonus: {
    name: 'Lucky Find',
    description: '+5% gear drop chance',
    baseCost: 150,
    costMultiplier: 2.5
  }
};

export const getUpgradeCost = (upgradeType: string, currentLevel: number): number => {
  const upgrade = upgradeShop[upgradeType];
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
};