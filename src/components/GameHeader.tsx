import React from 'react';
import { Coins, Trophy, Skull, Minimize2, Maximize2 } from 'lucide-react';

interface GameState {
  currentFloor: number;
  currentGroup: number;
  groupsPerFloor: number;
  gold: number;
  maxFloorReached: number;
  totalRuns: number;
  gearsFound: number;
  monstersKilled: number;
  totalGoldEarned: number;
}

interface GameHeaderProps {
  gameState: GameState;
  isCompactMode: boolean;
  setIsCompactMode: (value: boolean) => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  isCompactMode,
  setIsCompactMode
}) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🏰</div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Idle Dungeon Crawler
            </h1>
            <div className="text-sm text-gray-400">
              Floor <span className="font-mono">{gameState.currentFloor}</span>, Group <span className="font-mono">{gameState.currentGroup}/{gameState.groupsPerFloor}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCompactMode(!isCompactMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              isCompactMode 
                ? 'bg-blue-600/80 border-blue-500/50 text-white shadow-sm' 
                : 'bg-slate-600/50 border-slate-500/30 text-slate-300 hover:bg-slate-500/50'
            }`}
            title={isCompactMode ? "Switch to Expanded Mode" : "Switch to Compact Mode"}
          >
            {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isCompactMode ? 'Expand' : 'Compact'}
            </span>
          </button>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
              <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-semibold">
                <Coins className="w-4 h-4" />
                Gold
              </div>
              <div className="text-xl font-bold font-mono">{gameState.gold.toLocaleString()}</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-semibold">
                <Trophy className="w-4 h-4" />
                Best Floor
              </div>
              <div className="text-xl font-bold font-mono">{gameState.maxFloorReached}</div>
            </div>
            <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-semibold">
                <Skull className="w-4 h-4" />
                Total Runs
              </div>
              <div className="text-xl font-bold font-mono">{gameState.totalRuns}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center gap-6 text-sm text-gray-400">
        <div>Gear Found: <span className="font-mono">{gameState.gearsFound}</span></div>
        <div>Monsters Killed: <span className="font-mono">{gameState.monstersKilled}</span></div>
        <div>Total Gold Earned: <span className="font-mono">{gameState.totalGoldEarned.toLocaleString()}</span></div>
      </div>
    </div>
  );
};