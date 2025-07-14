import React, { useState, useEffect, useCallback, useRef } from 'react';
import { calculateMemberStats, initializeParty } from './data/PartyManager';
import { generateEnemyGroup } from './state/GameStateManager';
import { PartyDisplay } from './components/PartyDisplay';
import { EnemyDisplay } from './components/EnemyDisplay';
import { GameHeader } from './components/GameHeader';
import { GameControls } from './components/GameControls';
import { InfoPanel } from './components/InfoPanel';
import { getGearIcon } from './utils/FormatHelpers';
import { upgradeShop, getUpgradeCost } from './data/UpgradeConfig';
import { usePartyManagement } from './hooks/usePartyManagement';
import { useSkillProcessing } from './hooks/useSkillProcessing';
import { useGearManagement } from './hooks/useGearManagement';
import { useMassResurrection } from './hooks/useMassResurrection';
import { useGameLoop } from './hooks/useGameLoop';
import { useAttackTimers } from './hooks/useAttackTimers';

const IdleDungeonCrawler = () => {
  
  






  const [party, setParty] = useState(initializeParty());
  const combatLogRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState({
    currentFloor: 1,
    maxFloorReached: 1,
    currentGroup: 1,
    groupsPerFloor: 4,
    inCombat: false,
    enemies: [] as Array<{id: string, name: string, hp: number, maxHp: number, attack: number, defense: number}>,
    combatLog: [] as Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>,
    totalRuns: 0,
    gearsFound: 0,
    monstersKilled: 0,
    shieldWallActive: false,
    shieldWallTurns: 0,
    gold: 0,
    totalGoldEarned: 0,
    runHistory: [] as Array<{runNumber: number, floorReached: number, timestamp: number}>,
    attackTimer: 0, // Progress toward next attack (0-100) 
    enemyAttackTimer: 0, // Enemy attack timer (0-100)
    healerProtected: false, // Healer is in protected state
    massResurrectionTimer: 0, // Timer for mass resurrection (0-10000ms)
    performingMassRes: false // Currently performing mass resurrection
  });

  const [upgrades, setUpgrades] = useState({
    attackBonus: 0,
    defenseBonus: 0,
    healthBonus: 0,
    goldMultiplier: 0,
    gearDropBonus: 0
  });

  const [gameSpeed, setGameSpeed] = useState(1500); // Faster combat for more frequent encounters

  // Message filtering state
  const [messageFilters, setMessageFilters] = useState({
    combat: true,
    progression: true, 
    rewards: true,
    status: true,
    skills: true
  });

  // Compact mode state
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Initialize hooks
  usePartyManagement({
    party,
    upgrades,
    setParty
  });

  const { processSkills } = useSkillProcessing({
    gameSpeed,
    setParty,
    setGameState
  });

  const { upgradeGear } = useGearManagement({
    gameState,
    setParty,
    setGameState,
    upgrades
  });

  useMassResurrection({
    gameState,
    setGameState,
    setParty
  });


  useAttackTimers({
    gameState,
    party,
    upgrades,
    gameSpeed,
    setGameState,
    setParty
  });


  // Auto-scroll combat log to bottom when new messages are added
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [gameState.combatLog]);



  // Start new combat
  const startCombat = useCallback(() => {
    if (gameState.inCombat) return;
    
    const enemies = generateEnemyGroup(gameState.currentFloor, gameState.currentGroup);
    setGameState(prev => ({
      ...prev,
      inCombat: true,
      enemies,
      attackTimer: 0, // Reset attack timer
      enemyAttackTimer: 0, // Reset enemy attack timer
      combatLog: [...prev.combatLog, { text: `🏰 Floor ${prev.currentFloor}, Group ${prev.currentGroup}: ${enemies.length === 1 ? enemies[0].name : enemies.length + ' enemies'}!`, category: 'progression', timestamp: Date.now() }].slice(-3000)
    }));
  }, [gameState.inCombat, gameState.currentFloor, gameState.currentGroup, generateEnemyGroup]);

  // Upgrade gear


  const purchaseUpgrade = (upgradeType) => {
    const cost = getUpgradeCost(upgradeType, upgrades[upgradeType]);
    if (gameState.gold >= cost) {
      setGameState(prev => ({
        ...prev,
        gold: prev.gold - cost,
        combatLog: [...prev.combatLog, { text: `✨ Purchased ${upgradeShop[upgradeType].name}!`, category: 'skills', timestamp: Date.now() }].slice(-3000)
      }));
      
      setUpgrades(prev => ({
        ...prev,
        [upgradeType]: prev[upgradeType] + 1
      }));
      
      // Recalculate party stats
      setParty(prev => prev.map(member => {
        const newStats = calculateMemberStats(member, upgrades);
        const hpIncrease = newStats.maxHp - member.maxHp;
        return {
          ...member,
          hp: member.hp + Math.max(0, hpIncrease),
          maxHp: newStats.maxHp,
          attack: newStats.attack,
          defense: newStats.defense
        };
      }));
    }
  };

  useGameLoop({
    gameState,
    gameSpeed,
    processSkills,
    upgradeGear,
    startCombat
  });


  // Mass resurrection timer



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <GameHeader 
          gameState={gameState}
          isCompactMode={isCompactMode}
          setIsCompactMode={setIsCompactMode}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Party Status */}
          <PartyDisplay 
            party={party}
            gameState={gameState}
            gameSpeed={gameSpeed}
            getGearIcon={getGearIcon}
          />

          {/* Center Column - Combat Area */}
          <EnemyDisplay 
            gameState={gameState}
            gameSpeed={gameSpeed}
          />

          {/* Right Column - Controls & Info */}
          <InfoPanel 
            gameState={gameState}
            upgrades={upgrades}
            messageFilters={messageFilters}
            onPurchaseUpgrade={purchaseUpgrade}
            onUpdateFilters={setMessageFilters}
          />
        </div>

        <GameControls 
          gameSpeed={gameSpeed}
          onGameSpeedChange={setGameSpeed}
        />
      </div>
    </div>
  );
};

export default IdleDungeonCrawler;