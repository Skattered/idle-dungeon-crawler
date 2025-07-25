export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed?: number;
}

export interface PartyMember {
  name: string;
  role: string;
  dpsClass?: string;
  attackSpeed?: number;
  skill: {
    name: string;
    description: string;
    cooldown: number;
    effect: {
      type: string;
      value: number;
      duration?: number;
    };
  };
}

export const selectTarget = (attacker: PartyMember, enemies: Enemy[]): Enemy | null => {
  const aliveEnemies = enemies.filter(e => e.hp > 0);
  if (aliveEnemies.length === 0) return null;
  if (aliveEnemies.length === 1) return aliveEnemies[0];

  switch(attacker.role) {
    case 'tank':
      // Tank targets highest attack enemies (threat-based)
      return aliveEnemies.reduce((highest, current) => 
        current.attack > highest.attack ? current : highest
      );
    
    case 'healer':
      // Healer targets lowest HP enemies to finish them off
      return aliveEnemies.reduce((lowest, current) => 
        current.hp < lowest.hp ? current : lowest
      );
    
    case 'warrior':
      // Warrior uses balanced targeting (enemies around 50% HP)
      const sortedByHp = [...aliveEnemies].sort((a, b) => {
        const aPercent = a.hp / a.maxHp;
        const bPercent = b.hp / b.maxHp;
        return Math.abs(aPercent - 0.5) - Math.abs(bPercent - 0.5);
      });
      return sortedByHp[0];
    
    case 'rogue':
      // Rogue targets lowest HP enemies for quick eliminations
      return aliveEnemies.reduce((lowest, current) => 
        current.hp < lowest.hp ? current : lowest
      );
    
    case 'mage':
      // Mage targets highest HP enemies to maximize damage value
      return aliveEnemies.reduce((highest, current) => 
        current.hp > highest.hp ? current : highest
      );
    
    default:
      // Fallback to random targeting
      return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  }
};