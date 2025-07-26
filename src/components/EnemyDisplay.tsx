import React from 'react';
import { Skull, Sword, Zap } from 'lucide-react';

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed?: number;
}

interface GameState {
  currentFloor: number;
  inCombat: boolean;
  enemies: Enemy[];
  performingMassRes: boolean;
  massResurrectionTimer: number;
  enemyAttackTimer: number;
}

interface EnemyDisplayProps {
  gameState: GameState;
  gameSpeed: number;
}

export const EnemyDisplay: React.FC<EnemyDisplayProps> = ({ gameState, gameSpeed }) => {
  return (
    <div className="xl:col-span-1">
      {/* Combat Area */}
      <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 backdrop-blur-sm rounded-xl p-5 mb-6 border border-slate-600/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Combat Zone</h2>
          <div className="text-sm text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600">
            Floor <span className="font-mono">{gameState.currentFloor}</span>
          </div>
        </div>
        
        {/* Mass Resurrection Progress */}
        {gameState.performingMassRes && (
          <div className="mb-4 bg-yellow-900/30 rounded-lg p-4 border border-yellow-600/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="animate-pulse">🕊️</div>
              <span className="text-lg text-yellow-200 font-bold">Mass Resurrection</span>
              <span className="text-sm text-yellow-300 bg-yellow-800/50 px-2 py-1 rounded-full font-mono">
                {Math.ceil((10000 - gameState.massResurrectionTimer) / 1000)}s remaining
              </span>
            </div>
            <div className="w-full bg-yellow-800/30 rounded-full h-3 border border-yellow-600/40">
              <div 
                className="h-3 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-100"
                style={{ width: `${(gameState.massResurrectionTimer / 10000) * 100}%` }}
              />
            </div>
            <p className="text-xs text-yellow-300 mt-2 text-center">
              The healer channels divine energy to revive the fallen party...
            </p>
          </div>
        )}
        
        <div className="min-h-60">
          
          {gameState.enemies && gameState.enemies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 auto-rows-fr">
              {gameState.enemies.map((enemy, index) => (
                <div key={enemy.id || index} 
                     className={`relative bg-gradient-to-br from-slate-700/60 to-slate-800/80 backdrop-blur-sm rounded-lg p-3 border transition-all duration-300 min-h-[140px] flex flex-col ${
                       enemy.hp === 0 
                         ? 'opacity-40 border-slate-600/30 bg-gradient-to-br from-slate-800/40 to-slate-900/60' 
                         : 'border-slate-500/40 hover:border-red-400/30 shadow-lg hover:shadow-red-500/10'
                     }`}>
                  {enemy.hp === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <Skull className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Sword className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-200 truncate">{enemy.name || 'Unknown Enemy'}</h3>
                  </div>
                  
                  <div className="mb-3 flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300">Health</span>
                      <span className="text-xs text-slate-300 font-mono">
                        {typeof enemy.hp === 'number' && !isNaN(enemy.hp) ? enemy.hp : 0}/{typeof enemy.maxHp === 'number' && !isNaN(enemy.maxHp) ? enemy.maxHp : 100}
                      </span>
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-2 border border-slate-500/30">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          enemy.hp === 0 
                            ? 'bg-gradient-to-r from-gray-600 to-gray-500' 
                            : enemy.hp / (enemy.maxHp || 1) < 0.3
                              ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20 shadow-sm'
                              : enemy.hp / (enemy.maxHp || 1) < 0.7
                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                : 'bg-gradient-to-r from-green-500 to-emerald-400'
                        }`}
                        style={{ width: `${enemy.maxHp ? (enemy.hp / enemy.maxHp) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Individual Enemy Attack Timer */}
                  {enemy.hp > 0 && gameState.inCombat && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-red-300">Attack</span>
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          gameState.performingMassRes 
                            ? 'bg-yellow-600/50 text-yellow-200' 
                            : 'bg-red-600/50 text-red-200'
                        }`}>
                          {gameState.performingMassRes 
                            ? 'PAUSED' 
                            : (() => {
                                const attackTimer = gameState.enemyAttackTimer || 0;
                                const attackSpeed = enemy.attackSpeed || 1.0;
                                const timeRemaining = Math.ceil((100 - attackTimer) * gameSpeed / 100 / attackSpeed / 1000);
                                return <span className="font-mono">{Math.max(0, timeRemaining)}s</span>;
                              })()
                          }
                        </span>
                      </div>
                      <div className="w-full bg-slate-600/50 rounded-full h-1.5 border border-slate-500/30">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-75 ease-linear ${
                            gameState.performingMassRes 
                              ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' 
                              : 'bg-gradient-to-r from-red-600 to-red-500'
                          }`}
                          style={{ width: `${gameState.performingMassRes ? 0 : (gameState.enemyAttackTimer || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-xs mt-auto">
                    <div className="bg-slate-600/40 rounded px-2 py-1 border border-slate-500/30">
                      <div className="text-orange-300 font-medium">ATK</div>
                      <div className="text-slate-200 font-mono">{enemy.attack || 0}</div>
                    </div>
                    <div className="bg-slate-600/40 rounded px-2 py-1 border border-slate-500/30">
                      <div className="text-blue-300 font-medium">DEF</div>
                      <div className="text-slate-200 font-mono">{enemy.defense || 0}</div>
                    </div>
                    <div className="bg-slate-600/40 rounded px-2 py-1 border border-slate-500/30">
                      <div className={`font-medium ${
                        (enemy.attackSpeed || 1.0) > 1.0 ? 'text-red-300' : 
                        (enemy.attackSpeed || 1.0) < 1.0 ? 'text-green-300' : 
                        'text-slate-300'
                      }`}>SPD</div>
                      <div className="text-slate-200 font-mono">
                        {enemy.attackSpeed ? `${(enemy.attackSpeed * 100).toFixed(0)}%` : '100%'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-52 text-slate-400 bg-slate-700/20 rounded-lg border border-slate-600/30 border-dashed">
              <Zap className="w-8 h-8 mb-2 text-slate-500" />
              <span className="text-sm font-medium">Preparing for next encounter...</span>
              <span className="text-xs text-slate-500 mt-1">Enemies incoming</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};