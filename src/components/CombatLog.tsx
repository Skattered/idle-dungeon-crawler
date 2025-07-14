import React, { useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface CombatLogEntry {
  text: string;
  category: string;
  timestamp: number;
  isCritical?: boolean;
}

interface MessageFilters {
  combat: boolean;
  progression: boolean;
  rewards: boolean;
  status: boolean;
  skills: boolean;
}

interface CombatLogProps {
  combatLog: Array<CombatLogEntry | string>;
  messageFilters: MessageFilters;
  onUpdateFilters: (filters: MessageFilters) => void;
}

const getMessageCategory = (message: string): string => {
  if (message.includes('⚔️') || message.includes('🗡️') || message.includes('damage')) return 'combat';
  if (message.includes('🏆') || message.includes('✅') || message.includes('Floor') || message.includes('Group')) return 'progression';
  if (message.includes('💰') || message.includes('🎁') || message.includes('gold') || message.includes('Gear')) return 'rewards';
  if (message.includes('💀') || message.includes('wiped') || message.includes('Starting over')) return 'status';
  if (message.includes('🛡️') || message.includes('Shield Wall') || message.includes('Power Strike') || message.includes('✨')) return 'skills';
  return 'combat'; // default
};

export const CombatLog: React.FC<CombatLogProps> = ({
  combatLog,
  messageFilters,
  onUpdateFilters
}) => {
  const combatLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLog]);

  const categoryColors = {
    combat: 'text-red-300',
    progression: 'text-yellow-300',
    rewards: 'text-green-300',
    status: 'text-purple-300',
    skills: 'text-blue-300'
  };

  const filterCategories = {
    combat: { label: 'Combat', icon: '⚔️', color: 'red' },
    progression: { label: 'Progress', icon: '🏆', color: 'yellow' },
    rewards: { label: 'Rewards', icon: '💰', color: 'green' },
    status: { label: 'Status', icon: '💀', color: 'purple' },
    skills: { label: 'Skills', icon: '🛡️', color: 'blue' }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Combat Log</h2>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
      
      {/* Message Category Filters */}
      <div className="mb-4 flex flex-wrap gap-2 p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
        {Object.entries(filterCategories).map(([key, { label, icon, color }]) => (
          <button
            key={key}
            onClick={() => onUpdateFilters({ ...messageFilters, [key]: !messageFilters[key as keyof MessageFilters] })}
            className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-all duration-200 border ${
              messageFilters[key as keyof MessageFilters]
                ? `bg-${color}-600/80 border-${color}-500/50 text-white shadow-sm`
                : 'bg-slate-600/50 border-slate-500/30 text-slate-300 hover:bg-slate-500/50'
            }`}
          >
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
      
      <div ref={combatLogRef} className="bg-slate-700/40 rounded-lg p-3 h-48 overflow-y-auto border border-slate-600/30 shadow-inner">
        {combatLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Zap className="w-6 h-6 mb-2 text-slate-500" />
            <p className="text-sm">Starting adventure...</p>
          </div>
        ) : (
          combatLog
            .filter(entry => {
              // Handle both old string format and new object format
              const category = typeof entry === 'string' ? getMessageCategory(entry) : entry.category;
              return messageFilters[category as keyof MessageFilters];
            })
            .map((entry, index) => {
              const category = typeof entry === 'string' ? getMessageCategory(entry) : entry.category;
              const text = typeof entry === 'string' ? entry : entry.text;
              const isCritical = typeof entry === 'object' && entry.isCritical;
              
              return (
                <div key={index} 
                     className={`mb-2 text-sm p-2 rounded border-l-2 transition-all duration-200 ${
                       isCritical 
                         ? 'font-bold text-yellow-200 bg-yellow-900/20 border-l-yellow-400' 
                         : `${categoryColors[category as keyof typeof categoryColors] || 'text-slate-300'} bg-slate-600/20 border-l-slate-500/50 hover:bg-slate-600/30`
                     }`}>
                  {text}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};