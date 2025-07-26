
export const getMessageCategory = (message: string): string => {
  if (message.includes('⚔️') || message.includes('🗡️') || message.includes('damage')) return 'combat';
  if (message.includes('🏆') || message.includes('✅') || message.includes('Floor') || message.includes('Group')) return 'progression';
  if (message.includes('💰') || message.includes('🎁') || message.includes('gold') || message.includes('Gear')) return 'rewards';
  if (message.includes('💀') || message.includes('wiped') || message.includes('Starting over')) return 'status';
  if (message.includes('🛡️') || message.includes('Shield Wall') || message.includes('Power Strike') || message.includes('✨')) return 'skills';
  return 'combat'; // default
};

