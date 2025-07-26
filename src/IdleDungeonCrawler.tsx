import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { calculateMemberStats, initializeParty } from './data/PartyManager';
import { generateEnemyGroup } from './state/GameStateManager';
import { PartyDisplay } from './components/PartyDisplay';
import { EnemyDisplay } from './components/EnemyDisplay';
import { GameHeader } from './components/GameHeader';
import { GameControls } from './components/GameControls';
import { InfoPanel } from './components/InfoPanel';
import { GroupProgressBar } from './components/GroupProgressBar';
import { getGearIcon } from './utils/FormatHelpers';
import { upgradeShop, getUpgradeCost } from './data/UpgradeConfig';
import { usePartyManagement } from './hooks/usePartyManagement';
import { useSkillProcessing } from './hooks/useSkillProcessing';
import { useGearManagement } from './hooks/useGearManagement';
import { useGameLoopRefactored } from './hooks/useGameLoopRefactored';
import { useAttackTimersStore } from './hooks/useAttackTimersStore';
import { useMassResurrectionRefactored } from './hooks/useMassResurrectionRefactored';
import { useUnifiedGameTimer } from './hooks/useUnifiedGameTimer';
import { useProgressionSystem } from './hooks/useProgressionSystem';
import { useSaveSystem } from './hooks/useSaveSystem';
import { CombatLogManager } from './utils/CombatLogManager';
import { useGameStore } from './store/gameStore';
import { useChangelog } from './hooks/useChangelog';
import { ChangelogModal } from './components/ChangelogModal';

const IdleDungeonCrawler = () => {
  // Store selectors - using individual selectors to avoid recreating objects
  const currentFloor = useGameStore((state) => state.game.currentFloor);
  const maxFloorReached = useGameStore((state) => state.game.maxFloorReached);
  const currentGroup = useGameStore((state) => state.game.currentGroup);
  const totalGroupsPerFloor = useGameStore((state) => state.game.totalGroupsPerFloor);
  const inCombat = useGameStore((state) => state.combat.inCombat);
  const enemies = useGameStore((state) => state.combat.enemies);
  const combatLog = useGameStore((state) => state.combat.combatLog);
  const shieldWallActive = useGameStore((state) => state.combat.shieldWallActive);
  const shieldWallTurns = useGameStore((state) => state.combat.shieldWallTurns);
  const healerProtected = useGameStore((state) => state.combat.healerProtected);
  const enemyAttackTimer = useGameStore((state) => state.combat.enemyAttackTimer);
  const massResurrectionTimer = useGameStore((state) => state.combat.massResurrectionTimer);
  const performingMassRes = useGameStore((state) => state.combat.performingMassRes);
  const gold = useGameStore((state) => state.economy.gold);
  const totalGoldEarned = useGameStore((state) => state.economy.totalGoldEarned);
  const totalRuns = useGameStore((state) => state.progression.totalRuns);
  const gearsFound = useGameStore((state) => state.progression.gearsFound);
  const monstersKilled = useGameStore((state) => state.progression.monstersKilled);
  const runHistory = useGameStore((state) => state.progression.runHistory);
  
  // Create stable gameState object using useMemo
  const gameState = useMemo(() => ({
    currentFloor,
    maxFloorReached,
    currentGroup,
    totalGroupsPerFloor,
    inCombat,
    enemies,
    combatLog,
    shieldWallActive,
    shieldWallTurns,
    healerProtected,
    enemyAttackTimer,
    massResurrectionTimer,
    performingMassRes,
    gold,
    totalGoldEarned,
    totalRuns,
    gearsFound,
    monstersKilled,
    runHistory,
  }), [
    currentFloor, maxFloorReached, currentGroup, totalGroupsPerFloor,
    inCombat, enemies, combatLog, shieldWallActive, shieldWallTurns,
    healerProtected, enemyAttackTimer, massResurrectionTimer, performingMassRes,
    gold, totalGoldEarned, totalRuns, gearsFound, monstersKilled, runHistory
  ]);
  
  const upgrades = useGameStore((state) => state.economy.upgrades);
  const gameSpeed = useGameStore((state) => state.game.gameSpeed);
  const actions = useGameStore((state) => state.actions);
  
  // Legacy state - keeping party for now
  const [party, setParty] = useState(() => initializeParty());
  const combatLogRef = useRef<HTMLDivElement>(null);
  
  // Compatibility wrapper for hooks that still use setGameState
  const setGameState = useCallback((updater: any) => {
    if (typeof updater === 'function') {
      // Schedule state updates asynchronously to avoid "setState during render" errors
      queueMicrotask(() => {
        // Get current state directly from store to avoid circular dependency
        const store = useGameStore.getState();
        const currentState = {
          currentFloor: store.game.currentFloor,
          maxFloorReached: store.game.maxFloorReached,
          currentGroup: store.game.currentGroup,
          totalGroupsPerFloor: store.game.totalGroupsPerFloor,
          inCombat: store.combat.inCombat,
          enemies: store.combat.enemies,
          combatLog: store.combat.combatLog,
          shieldWallActive: store.combat.shieldWallActive,
          shieldWallTurns: store.combat.shieldWallTurns,
          healerProtected: store.combat.healerProtected,
          enemyAttackTimer: store.combat.enemyAttackTimer,
          massResurrectionTimer: store.combat.massResurrectionTimer,
          performingMassRes: store.combat.performingMassRes,
          gold: store.economy.gold,
          totalGoldEarned: store.economy.totalGoldEarned,
          totalRuns: store.progression.totalRuns,
          gearsFound: store.progression.gearsFound,
          monstersKilled: store.progression.monstersKilled,
          runHistory: store.progression.runHistory,
          attackTimer: 0, // Legacy field
        };
        
        const newState = updater(currentState);
        
        // Map old gameState changes to new store actions
        if (newState.inCombat !== currentState.inCombat) {
          actions.setCombatState({ inCombat: newState.inCombat });
        }
        if (newState.enemies !== currentState.enemies) {
          actions.setEnemies(newState.enemies);
        }
        if (newState.combatLog !== currentState.combatLog) {
          actions.setCombatLog(newState.combatLog);
        }
        if (newState.gold !== currentState.gold) {
          actions.setGold(newState.gold);
        }
        if (newState.currentFloor !== currentState.currentFloor) {
          actions.setCurrentFloor(newState.currentFloor);
        }
        if (newState.currentGroup !== currentState.currentGroup) {
          actions.setCurrentGroup(newState.currentGroup);
        }
        if (newState.shieldWallActive !== currentState.shieldWallActive) {
          actions.setShieldWall(newState.shieldWallActive, newState.shieldWallTurns || 0);
        }
        if (newState.massResurrectionTimer !== currentState.massResurrectionTimer) {
          actions.setMassResurrection(newState.performingMassRes || false, newState.massResurrectionTimer);
        }
        if (newState.gearsFound !== currentState.gearsFound) {
          actions.setGearsFound(newState.gearsFound);
        }
        if (newState.monstersKilled !== currentState.monstersKilled) {
          actions.setMonstersKilled(newState.monstersKilled);
        }
        if (newState.totalGoldEarned !== currentState.totalGoldEarned) {
          actions.earnGold(newState.totalGoldEarned - currentState.totalGoldEarned);
        }
      });
    }
  }, [actions]); // Only depend on actions, not gameState
  
  const setUpgrades = useCallback((updater: any) => {
    const newUpgrades = typeof updater === 'function' ? updater(upgrades) : updater;
    actions.setUpgrades(newUpgrades);
  }, [upgrades, actions]);

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

  // Initialize Combat Log Manager - Using direct store access
  useEffect(() => {
    CombatLogManager.setUpdateCallback((updater: any) => {
      if (typeof updater === 'function') {
        const store = useGameStore.getState();
        const currentState = {
          combatLog: store.combat.combatLog,
        };
        const newState = updater(currentState);
        
        if (newState.combatLog !== currentState.combatLog) {
          store.actions.setCombatLog(newState.combatLog);
        }
      }
    });
    return () => CombatLogManager.clearUpdateCallback();
  }, []); // No dependencies - callback uses store directly

  // Initialize hooks - RE-ENABLING ONE BY ONE
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


  // Progression system for handling combat completion and party wipes
  const { resetToFloorOne, advanceProgression } = useProgressionSystem({
    gameState,
    upgrades,
    setGameState,
    setParty
  });
  

  // Start new combat function - now using store actions
  const startCombat = useCallback(() => {
    if (inCombat) return;
    
    const enemyGroup = generateEnemyGroup(currentFloor, currentGroup);
    
    // Use atomic store actions instead of multiple setGameState calls
    actions.startCombat(enemyGroup);
    
    // Add combat start message through CombatLogManager
    CombatLogManager.addMessage({
      text: `🏰 Floor ${currentFloor} - Group ${currentGroup}/${totalGroupsPerFloor}: ${enemyGroup.length === 1 ? enemyGroup[0].name : enemyGroup.length + ' enemies'}!`,
      category: 'progression',
      timestamp: Date.now()
    });
  }, [inCombat, currentFloor, currentGroup, totalGroupsPerFloor, actions]);

  // Initialize store-based hooks - FIXED INFINITE LOOP
  const { processAttackTimers } = useAttackTimersStore({
    party,
    upgrades,
    gameSpeed,
    setParty
  });

  const { processGameLoop } = useGameLoopRefactored({
    gameState,
    processSkills,
    upgradeGear,
    startCombat
  });

  const { processMassResurrection } = useMassResurrectionRefactored({
    gameState,
    upgrades,
    setGameState,
    setParty
  });

  // Unified timer system replaces individual timers
  useUnifiedGameTimer({
    gameState,
    party,
    upgrades,
    gameSpeed,
    setGameState,
    setParty,
    processSkills,
    upgradeGear,
    startCombat,
    processAttackTimers,
    processGameLoop,
    processMassResurrection
  });

  const { exportSave, importSave, manualSave } = useSaveSystem({
    gameState,
    party,
    upgrades,
    setGameState,
    setParty,
    setUpgrades
  });

  // Changelog system
  const { 
    showChangelog, 
    closeChangelog, 
    forceShowChangelog,
    isInitialized,
    changelog,
    latestVersion 
  } = useChangelog();
  
  // All hooks now enabled - no more temporary functions needed


  // Auto-scroll combat log to bottom when new messages are added
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [gameState.combatLog]);




  const purchaseUpgrade = useCallback((upgradeType) => {
    const cost = getUpgradeCost(upgradeType, upgrades[upgradeType]);
    
    // Check if sufficient gold and not in critical combat
    if (gold < cost) {
      return;
    }
    
    const isCriticalCombat = inCombat && party.some(member => member.hp < member.maxHp * 0.1);
    if (isCriticalCombat) {
      return;
    }
    
    // Use store action for atomic purchase
    const success = actions.purchaseUpgrade(upgradeType, cost);
    
    if (!success) {
      return;
    }
    
    // Recalculate party stats with new upgrade values
    const newUpgrades = {
      ...upgrades,
      [upgradeType]: upgrades[upgradeType] + 1
    };
    
    setParty(prev => prev.map(member => {
      const newStats = calculateMemberStats(member, newUpgrades);
      const hpIncrease = newStats.maxHp - member.maxHp;
      return {
        ...member,
        hp: member.hp + Math.max(0, hpIncrease),
        maxHp: newStats.maxHp,
        attack: newStats.attack,
        defense: newStats.defense
      };
    }));
    
    // Add purchase message through CombatLogManager
    CombatLogManager.addMessage({
      text: `✨ Purchased ${upgradeShop[upgradeType].name}!`,
      category: 'skills',
      timestamp: Date.now()
    });
  }, [upgrades, gold, inCombat, party, actions, setParty]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <GameHeader 
          gameState={gameState}
          isCompactMode={isCompactMode}
          setIsCompactMode={setIsCompactMode}
          onShowChangelog={forceShowChangelog}
        />
        
        <GroupProgressBar 
          currentGroup={gameState.currentGroup}
          totalGroups={gameState.totalGroupsPerFloor}
          currentFloor={gameState.currentFloor}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Party Status */}
          <PartyDisplay 
            party={party}
            gameState={gameState}
            gameSpeed={gameSpeed}
            getGearIcon={getGearIcon}
            setParty={setParty}
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
            onExportSave={exportSave}
            onImportSave={importSave}
            onManualSave={manualSave}
          />
        </div>

        <GameControls 
          gameSpeed={gameSpeed}
          onGameSpeedChange={actions.setGameSpeed}
        />
      </div>

      {/* Changelog Modal */}
      {isInitialized && (
        <ChangelogModal
          isOpen={showChangelog}
          onClose={closeChangelog}
          changelog={changelog}
          latestVersion={latestVersion}
        />
      )}
    </div>
  );
};

export default IdleDungeonCrawler;