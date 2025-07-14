export const calculateDamageReduction = (damage: number, reduction: number): number => {
  return Math.floor(damage * (1 - reduction));
};

export const isLowHealth = (hp: number, maxHp: number, threshold: number = 0.3): boolean => {
  return (hp / maxHp) <= threshold;
};

export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};