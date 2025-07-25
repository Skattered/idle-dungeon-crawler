import React from 'react';
import { Coins, Trophy, Skull, Minimize2, Maximize2 } from 'lucide-react';

interface GameState {
  currentFloor: number;
  currentGroup: number;
  totalGroupsPerFloor: number;
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
  onShowChangelog?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  isCompactMode,
  setIsCompactMode,
  onShowChangelog
}) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 sm:p-6 mb-6 border border-slate-700">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-2xl sm:text-4xl">🏰</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Idle Dungeon Crawler
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-gray-400 mt-1">
              <span className="truncate">
                Floor <span className="font-mono">{gameState.currentFloor}</span> - Group <span className="font-mono">{gameState.currentGroup}/{gameState.totalGroupsPerFloor}</span>
              </span>
              <span className="hidden sm:inline text-xs bg-green-600/50 px-2 py-1 rounded font-mono border border-green-500/30">
                v{__APP_VERSION__ || '0.1.0'}{!(__IS_PRODUCTION__ ?? true) && __BUILD_TIME__ ? ` - ${new Date(__BUILD_TIME__).toLocaleTimeString()}` : ''}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <button
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border transition-all duration-200 ${
                isCompactMode 
                  ? 'bg-blue-600/80 border-blue-500/50 text-white shadow-sm' 
                  : 'bg-slate-600/50 border-slate-500/30 text-slate-300 hover:bg-slate-500/50'
              }`}
              title={isCompactMode ? "Switch to Expanded Mode" : "Switch to Compact Mode"}
            >
              {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              <span className="text-xs sm:text-sm font-medium">
                {isCompactMode ? 'Expand' : 'Compact'}
              </span>
            </button>
            
            {onShowChangelog && (
              <button
                onClick={onShowChangelog}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border transition-all duration-200 bg-slate-600/50 border-slate-500/30 text-slate-300 hover:bg-slate-500/50"
                title="View Changelog"
              >
                📄
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                  What's New
                </span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="bg-yellow-500/20 rounded-lg p-2 sm:p-3 border border-yellow-500/30">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-yellow-400 text-xs sm:text-sm font-semibold">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Gold</span>
              </div>
              <div className="text-sm sm:text-xl font-bold font-mono">{gameState.gold.toLocaleString()}</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-2 sm:p-3 border border-blue-500/30">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-blue-400 text-xs sm:text-sm font-semibold">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Best Floor</span>
              </div>
              <div className="text-sm sm:text-xl font-bold font-mono">{gameState.maxFloorReached}</div>
            </div>
            <div className="bg-red-500/20 rounded-lg p-2 sm:p-3 border border-red-500/30">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-red-400 text-xs sm:text-sm font-semibold">
                <Skull className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Total Runs</span>
              </div>
              <div className="text-sm sm:text-xl font-bold font-mono">{gameState.totalRuns}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
        <div>Gear Found: <span className="font-mono">{gameState.gearsFound}</span></div>
        <div>Monsters Killed: <span className="font-mono">{gameState.monstersKilled}</span></div>
        <div className="w-full sm:w-auto text-center sm:text-left">Total Gold Earned: <span className="font-mono">{gameState.totalGoldEarned.toLocaleString()}</span></div>
      </div>
    </div>
  );
};