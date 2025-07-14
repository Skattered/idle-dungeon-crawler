import React from 'react';

interface GameControlsProps {
  gameSpeed: number;
  onGameSpeedChange: (speed: number) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameSpeed,
  onGameSpeedChange
}) => {
  return (
    <div className="mt-6 text-center">
      <label className="block text-sm font-medium mb-2">Game Speed</label>
      <input
        type="range"
        min="500"
        max="3000"
        step="250"
        value={gameSpeed}
        onChange={(e) => onGameSpeedChange(Number(e.target.value))}
        className="w-64"
      />
      <div className="text-sm text-gray-400 mt-1">
        {gameSpeed}ms per action
      </div>
    </div>
  );
};