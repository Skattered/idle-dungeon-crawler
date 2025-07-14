export interface UpgradeState {
  healthBonus: number;
  attackBonus: number; 
  defenseBonus: number;
}

export const getUpgradeCost = (upgradeType: keyof UpgradeState, currentLevel: number): number => {
  const baseCosts = {
    healthBonus: 50,
    attackBonus: 100,
    defenseBonus: 75
  };
  
  return Math.floor(baseCosts[upgradeType] * Math.pow(1.5, currentLevel));
};

export const canAffordUpgrade = (upgradeType: keyof UpgradeState, currentLevel: number, gold: number): boolean => {
  return gold >= getUpgradeCost(upgradeType, currentLevel);
};

export const purchaseUpgrade = (
  upgradeType: keyof UpgradeState, 
  currentUpgrades: UpgradeState, 
  gold: number
): { newUpgrades: UpgradeState; newGold: number; success: boolean } => {
  const cost = getUpgradeCost(upgradeType, currentUpgrades[upgradeType]);
  
  if (!canAffordUpgrade(upgradeType, currentUpgrades[upgradeType], gold)) {
    return { newUpgrades: currentUpgrades, newGold: gold, success: false };
  }
  
  const newUpgrades = {
    ...currentUpgrades,
    [upgradeType]: currentUpgrades[upgradeType] + 1
  };
  
  return {
    newUpgrades,
    newGold: gold - cost,
    success: true
  };
};