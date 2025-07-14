import React from 'react';
import { Users } from 'lucide-react';
import { dpsClasses } from '../data/GameConfig';

interface PartyMember {
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackTimer: number;
  icon: any;
  skill: any;
  skillCooldown: number;
  skillActive: boolean;
  dpsClass?: string;
  attackSpeed?: number;
  isProtected?: boolean;
  gear: any;
}

interface GameState {
  inCombat: boolean;
}

interface PartyDisplayProps {
  party: PartyMember[];
  gameState: GameState;
  gameSpeed: number;
  getGearIcon: (slot: string) => any;
}

export const PartyDisplay: React.FC<PartyDisplayProps> = ({ 
  party, 
  gameState, 
  gameSpeed, 
  getGearIcon 
}) => {
  return (
    <div className="xl:col-span-1">
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Party
        </h2>
        <div className="space-y-3">
          {party.map((member, index) => {
            const IconComponent = member.icon;
            const hpPercent = (member.hp / member.maxHp) * 100;
            const isLowHp = hpPercent <= 30;
            const isDead = member.hp <= 0;
            
            // Get class-specific styling for DPS classes
            const dpsClass = member.dpsClass ? dpsClasses[member.dpsClass] : null;
            const classColor = dpsClass ? dpsClass.color : 
              member.role === 'tank' ? 'blue' :
              member.role === 'healer' ? 'green' : 'red';
            
            return (
              <div key={index} className={`rounded-lg p-3 border transition-all ${
                member.isProtected ? 'bg-yellow-900/40 border-yellow-400/70 shadow-lg shadow-yellow-400/20' :
                isDead ? 'bg-red-900/30 border-red-500/50' : 
                isLowHp ? 'bg-yellow-900/20 border-yellow-500/50' : 
                dpsClass ? `bg-gradient-to-br ${dpsClass.bgGradient} ${dpsClass.borderColor} hover:border-${dpsClass.color}-400/50` :
                'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'
              }`}>
                {/* Member Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 text-${classColor}-400`} />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{member.name}</span>
                      {dpsClass && (
                        <span className="text-xs text-slate-400">{dpsClass.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded text-white font-semibold bg-${classColor}-500/30`}>
                      {member.role.toUpperCase()}
                    </span>
                    {member.isProtected && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-600/50 text-yellow-200 font-bold">
                        🛡️ PROTECTED
                      </span>
                    )}
                    {member.attackSpeed && member.attackSpeed !== 1.0 && !member.isProtected && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        member.attackSpeed > 1.0 ? 'bg-green-600/30 text-green-300' : 'bg-orange-600/30 text-orange-300'
                      }`}>
                        {member.attackSpeed > 1.0 ? 'Fast' : 'Slow'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* HP Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Health</span>
                    <span className={isLowHp && !isDead ? 'text-yellow-300 font-bold' : 'text-gray-300'}>
                      {member.hp}/{member.maxHp}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isDead ? 'bg-gray-500' :
                        hpPercent > 60 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        hpPercent > 30 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                        'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="bg-red-500/20 rounded px-2 py-1 text-center border border-red-500/30">
                    <div className="text-red-300 font-semibold">ATK</div>
                    <div className="font-bold text-white">{member.attack}</div>
                  </div>
                  <div className="bg-blue-500/20 rounded px-2 py-1 text-center border border-blue-500/30">
                    <div className="text-blue-300 font-semibold">DEF</div>
                    <div className="font-bold text-white">{member.defense}</div>
                  </div>
                </div>
                
                {/* Skill Status */}
                <div className="bg-slate-600/50 rounded-lg p-2 border border-slate-500/30">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-purple-300 font-semibold truncate">{member.skill.name}</span>
                    <span className={`text-xs font-bold ${
                      member.skillCooldown > 0 ? 'text-red-300' :
                      member.skillActive ? 'text-green-300' : 'text-green-300'
                    }`}>
                      {member.skillCooldown > 0 ? `${Math.ceil(member.skillCooldown / 1000)}s` :
                       member.skillActive ? 'ACTIVE' : 'READY'}
                    </span>
                  </div>
                  {member.skillCooldown > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all ease-linear"
                        style={{ 
                          width: `${100 - (member.skillCooldown / member.skill.cooldown) * 100}%`,
                          transitionDuration: `${gameSpeed}ms`
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Attack Timer Display */}
                {gameState.inCombat && member.hp > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Next Attack</span>
                      <span className={`text-xs px-1 rounded ${
                        member.attackSpeed && member.attackSpeed > 1.0 ? 'bg-green-600/30 text-green-300' : 
                        member.attackSpeed && member.attackSpeed < 1.0 ? 'bg-orange-600/30 text-orange-300' : 
                        'bg-slate-600/30 text-slate-300'
                      }`}>
                        {member.attackSpeed && member.attackSpeed > 1.0 ? <span className="font-mono">{(member.attackSpeed * 100).toFixed(0)}%</span> : 
                         member.attackSpeed && member.attackSpeed < 1.0 ? <span className="font-mono">{(member.attackSpeed * 100).toFixed(0)}%</span> : 
                         'Normal'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 border border-slate-600/30">
                      <div 
                        className={`h-1.5 rounded-full transition-all ease-linear ${
                          member.attackSpeed && member.attackSpeed > 1.0 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                          member.attackSpeed && member.attackSpeed < 1.0 ? 'bg-gradient-to-r from-orange-500 to-yellow-400' :
                          'bg-gradient-to-r from-blue-500 to-cyan-400'
                        }`}
                        style={{ 
                          width: `${member.attackTimer || 0}%`,
                          transitionDuration: '100ms'
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Gear Display */}
                <div className="bg-slate-600/30 rounded-lg p-2 border border-slate-500/30">
                  <div className="text-xs font-semibold text-purple-300 mb-2">Equipment</div>
                  <div className="grid grid-cols-5 gap-1">
                    {Object.entries(member.gear).slice(0, 10).map(([slot, item]: [string, any]) => {
                      const IconComponent = getGearIcon(slot);
                      return (
                        <div key={slot} className="relative bg-slate-700/50 rounded p-1 text-center" title={`${item.name} (Level ${item.level})`}>
                          <IconComponent className="w-3 h-3 mx-auto text-gray-300" />
                          <div className="text-xs text-yellow-300 font-bold">{item.level}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};