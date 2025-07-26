import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { upgradeShop, getUpgradeCost } from '../data/UpgradeConfig';

interface Upgrades {
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  goldMultiplier: number;
  gearDropBonus: number;
}

interface UpgradeShopProps {
  gameState: { gold: number };
  upgrades: Upgrades;
  onPurchaseUpgrade: (upgradeType: string) => void;
}


export const UpgradeShop: React.FC<UpgradeShopProps> = ({
  gameState,
  upgrades,
  onPurchaseUpgrade
}) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        Upgrades
      </h2>
      <div className="space-y-3">
        {Object.entries(upgradeShop).map(([key, upgrade]) => {
          const currentLevel = upgrades[key as keyof Upgrades];
          const cost = getUpgradeCost(key, currentLevel);
          const canAfford = gameState.gold >= cost;
          
          return (
            <div key={key} className="bg-gray-700 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-sm">{upgrade.name}</div>
                  <div className="text-xs text-gray-300">Level {currentLevel}</div>
                </div>
                <button
                  onClick={() => onPurchaseUpgrade(key)}
                  disabled={!canAfford}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    canAfford 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {cost}g
                </button>
              </div>
              <div className="text-xs text-gray-400">{upgrade.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};