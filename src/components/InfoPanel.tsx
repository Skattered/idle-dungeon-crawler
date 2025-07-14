import React from 'react';
import { UpgradeShop } from './UpgradeShop';
import { CombatLog } from './CombatLog';

interface RunHistoryEntry {
  runNumber: number;
  floorReached: number;
  timestamp: number;
}

interface GameState {
  runHistory: RunHistoryEntry[];
  combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
  gold: number;
}

interface Upgrades {
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  goldMultiplier: number;
  gearDropBonus: number;
}

interface MessageFilters {
  combat: boolean;
  progression: boolean;
  rewards: boolean;
  status: boolean;
  skills: boolean;
}

interface InfoPanelProps {
  gameState: GameState;
  upgrades: Upgrades;
  messageFilters: MessageFilters;
  onPurchaseUpgrade: (upgradeType: string) => void;
  onUpdateFilters: (filters: MessageFilters) => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  gameState,
  upgrades,
  messageFilters,
  onPurchaseUpgrade,
  onUpdateFilters
}) => {
  return (
    <div className="xl:col-span-1 space-y-6">
      {/* Run History */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <h2 className="text-lg font-bold mb-4">Run History</h2>
        {gameState.runHistory.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-600">
              <span>Run</span>
              <span>Floor</span>
              <span>Time</span>
            </div>
            {gameState.runHistory.slice().reverse().map((run) => (
              <div key={run.runNumber} className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-300">#{run.runNumber}</span>
                <span className="text-yellow-400">{run.floorReached}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            No runs completed yet
          </div>
        )}
      </div>

      {/* Upgrade Shop */}
      <UpgradeShop 
        gameState={gameState}
        upgrades={upgrades}
        onPurchaseUpgrade={onPurchaseUpgrade}
      />

      <CombatLog 
        combatLog={gameState.combatLog}
        messageFilters={messageFilters}
        onUpdateFilters={onUpdateFilters}
      />
    </div>
  );
};