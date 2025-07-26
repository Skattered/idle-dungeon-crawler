export const calculateCriticalHit = (
  baseDamage: number, 
  critChance: number = 0.1, 
  critMultiplier: number = 2.0
): { damage: number; isCritical: boolean } => {
  const isCritical = Math.random() < critChance;
  const finalDamage = isCritical ? Math.floor(baseDamage * critMultiplier) : baseDamage;
  return { damage: finalDamage, isCritical };
};