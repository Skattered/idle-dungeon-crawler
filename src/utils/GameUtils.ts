interface PartyMember {
  hp: number;
  attack: number;
  defense: number;
}

interface Enemy {
  hp: number;
  attack: number;
  defense: number;
}

interface CombatMessage {
  text: string;
  category: string;
  timestamp: number;
  isCritical?: boolean;
}

export const getMessageCategory = (message: string): string => {
  if (message.includes('⚔️') || message.includes('🗡️') || message.includes('damage')) return 'combat';
  if (message.includes('🏆') || message.includes('✅') || message.includes('Floor') || message.includes('Group')) return 'progression';
  if (message.includes('💰') || message.includes('🎁') || message.includes('gold') || message.includes('Gear')) return 'rewards';
  if (message.includes('💀') || message.includes('wiped') || message.includes('Starting over')) return 'status';
  if (message.includes('🛡️') || message.includes('Shield Wall') || message.includes('Power Strike') || message.includes('✨')) return 'skills';
  return 'combat'; // default
};

export const createCombatMessage = (message: string, category: string = 'combat', isCritical: boolean = false): CombatMessage => {
  return {
    text: message,
    category: category,
    timestamp: Date.now(),
    isCritical
  };
};

export const getPartyStats = (party: PartyMember[]) => {
  const aliveMembers = party.filter(member => member.hp > 0);
  const totalAttack = aliveMembers.reduce((sum, member) => sum + member.attack, 0);
  const totalDefense = aliveMembers.reduce((sum, member) => sum + member.defense, 0);
  return { totalAttack, totalDefense, aliveMembers: aliveMembers.length };
};

export const getEnemyStats = (enemies: Enemy[]) => {
  const aliveEnemies = enemies.filter(enemy => enemy.hp > 0);
  const totalAttack = aliveEnemies.reduce((sum, enemy) => sum + enemy.attack, 0);
  const totalDefense = aliveEnemies.reduce((sum, enemy) => sum + enemy.defense, 0);
  return { totalAttack, totalDefense, aliveEnemies: aliveEnemies.length, aliveEnemiesArray: aliveEnemies };
};