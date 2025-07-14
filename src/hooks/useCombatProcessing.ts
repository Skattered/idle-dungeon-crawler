import { useCallback } from 'react';
import { getPartyStats, getMessageCategory } from '../utils/GameUtils';

interface UseCombatProcessingParams {
  gameState: {
    inCombat: boolean;
    enemies: Array<{id: string, name: string, hp: number, maxHp: number, attack: number, defense: number}>;
    currentFloor: number;
    currentGroup: number;
    groupsPerFloor: number;
    totalRuns: number;
    runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
    combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
    maxFloorReached: number;
    monstersKilled: number;
    gold: number;
    totalGoldEarned: number;
    gearsFound: number;
    shieldWallActive: boolean;
    shieldWallTurns: number;
  };
  party: Array<{
    hp: number;
    maxHp: number;
    skillActive: boolean;
    skill: { effect: { type: string; value: number } };
    attack: number;
  }>;
  upgrades: {
    goldMultiplier: number;
    gearDropBonus: number;
  };
  setGameState: (updater: (prev: any) => any) => void;
  setParty: (updater: (prev: any[]) => any[]) => void;
}

export const useCombatProcessing = ({ 
  gameState, 
  party, 
  upgrades, 
  setGameState, 
  setParty 
}: UseCombatProcessingParams) => {
  
  const processCombat = useCallback(() => {
    if (!gameState.inCombat || !gameState.enemies || gameState.enemies.length === 0) return;

    const partyStats = getPartyStats(party);
    const aliveEnemies = gameState.enemies.filter(enemy => enemy.hp > 0);
    
    // Check if party is wiped at start of combat turn
    if (partyStats.aliveMembers === 0) {
      // Party wiped, restart with full health
      setGameState(prev => {
        const newRunHistory = [
          ...prev.runHistory,
          {
            runNumber: prev.totalRuns + 1,
            floorReached: prev.currentFloor,
            timestamp: Date.now()
          }
        ].slice(-10); // Keep only last 10 runs
        
        return {
          ...prev,
          inCombat: false,
          enemies: [],
          currentGroup: 1,
          currentFloor: 1,
          totalRuns: prev.totalRuns + 1,
          runHistory: newRunHistory,
          combatLog: [...prev.combatLog, { text: "💀 Party wiped! Starting over...", category: 'status', timestamp: Date.now() }].slice(-3000)
        };
      });
      
      // Reset all party members to full health
      setParty(prev => prev.map(member => ({
        ...member,
        hp: member.maxHp
      })));
      return;
    }

    // Check if all enemies are defeated
    if (aliveEnemies.length === 0) {
      setGameState(prev => {
        const newState = { ...prev };
        const newGroup = prev.currentGroup + 1;
        
        if (newGroup > prev.groupsPerFloor) {
          // Floor completed, advance to next floor
          return {
            ...newState,
            inCombat: false,
            enemies: [],
            currentGroup: 1,
            currentFloor: newState.currentFloor + 1,
            maxFloorReached: Math.max(newState.maxFloorReached, newState.currentFloor + 1),
            combatLog: [...newState.combatLog, { text: `🏆 Floor ${newState.currentFloor} completed!`, category: 'progression', timestamp: Date.now() }].slice(-3000)
          };
        } else {
          // Next group on same floor
          return {
            ...newState,
            inCombat: false,
            enemies: [],
            currentGroup: newGroup,
            combatLog: [...newState.combatLog, { text: `✅ Group ${prev.currentGroup} defeated!`, category: 'progression', timestamp: Date.now() }].slice(-3000)
          };
        }
      });
      return;
    }

    setGameState(prev => {
      const newState = { ...prev };
      const enemies = [...prev.enemies];
      
      // Party attacks enemies (only alive members contribute)
      let partyDamage = Math.max(1, partyStats.totalAttack - Math.floor(aliveEnemies.reduce((sum, e) => sum + e.defense, 0) / aliveEnemies.length));
      
      // Check for Power Strike boosts
      const powerStrikeMembers = party.filter(member => 
        member.hp > 0 && member.skillActive && member.skill.effect.type === 'damage_boost'
      );
      
      if (powerStrikeMembers.length > 0) {
        const totalBoost = powerStrikeMembers.reduce((sum, member) => 
          sum + (member.attack * (member.skill.effect.value - 1)), 0
        );
        partyDamage += totalBoost;
      }
      
      // Target single enemy (first alive enemy)
      let enemiesDefeated = 0;
      
      if (aliveEnemies.length > 0) {
        const targetEnemy = aliveEnemies[0]; // Target first alive enemy
        const enemyIndex = enemies.findIndex(e => e.id === targetEnemy.id);
        if (enemyIndex !== -1) {
          enemies[enemyIndex].hp = Math.max(0, enemies[enemyIndex].hp - partyDamage);
          if (enemies[enemyIndex].hp === 0) {
            enemiesDefeated = 1;
          }
        }
      }
      
      // Calculate gold and gear rewards
      const goldEarned = Math.floor(enemiesDefeated * (3 + newState.currentFloor) * (1 + upgrades.goldMultiplier * 0.1));
      const gearDropChance = 0.15 + (newState.currentFloor * 0.01) + (upgrades.gearDropBonus * 0.05);
      const gearDrop = Math.random() < (gearDropChance * enemiesDefeated);
      
      let logEntry = '';
      if (aliveEnemies.length > 0) {
        const targetEnemy = aliveEnemies[0];
        logEntry = `⚔️ Party attacks ${targetEnemy.name} for ${partyDamage} damage`;
        if (enemiesDefeated > 0) {
          logEntry += ` - ${targetEnemy.name} defeated! +${goldEarned} gold`;
          if (gearDrop) {
            logEntry += " 🎁 Gear found!";
          }
        }
      }
      
      // Enemies attack party
      const totalEnemyAttack = aliveEnemies.reduce((sum, enemy) => sum + enemy.attack, 0);
      let enemyDamage = Math.max(1, totalEnemyAttack - Math.floor(partyStats.totalDefense / 3));
      
      // Apply Shield Wall damage reduction
      if (newState.shieldWallActive && newState.shieldWallTurns > 0) {
        enemyDamage = Math.floor(enemyDamage * 0.5);
        newState.shieldWallTurns -= 1;
        if (newState.shieldWallTurns <= 0) {
          newState.shieldWallActive = false;
        }
      }
      
      logEntry += ` | 🗡️ Enemies attack for ${enemyDamage} damage`;
      
      return {
        ...newState,
        enemies,
        monstersKilled: newState.monstersKilled + enemiesDefeated,
        gold: newState.gold + goldEarned,
        totalGoldEarned: newState.totalGoldEarned + goldEarned,
        gearsFound: gearDrop ? newState.gearsFound + 1 : newState.gearsFound,
        combatLog: [...newState.combatLog, { text: logEntry, category: getMessageCategory(logEntry), timestamp: Date.now() }].slice(-3000)
      };
    });

    // Update party HP after enemy attack
    setParty(prev => {
      if (!gameState.enemies || !gameState.inCombat) return prev;
      
      const newParty = [...prev];
      const aliveMembers = newParty.filter(member => member.hp > 0);
      const aliveEnemies = gameState.enemies.filter(enemy => enemy.hp > 0);
      
      if (aliveMembers.length > 0 && aliveEnemies.length > 0) {
        const totalEnemyAttack = aliveEnemies.reduce((sum, enemy) => sum + enemy.attack, 0);
        let enemyDamage = Math.max(1, totalEnemyAttack - Math.floor(partyStats.totalDefense / 3));
        
        // Apply Shield Wall damage reduction
        if (gameState.shieldWallActive && gameState.shieldWallTurns > 0) {
          enemyDamage = Math.floor(enemyDamage * 0.5);
        }
        
        const targetIndex = newParty.findIndex(member => member === aliveMembers[Math.floor(Math.random() * aliveMembers.length)]);
        
        if (targetIndex !== -1) {
          newParty[targetIndex] = {
            ...newParty[targetIndex],
            hp: Math.max(0, newParty[targetIndex].hp - enemyDamage)
          };
        }
      }
      
      // Deactivate Power Strike for all DPS members after combat turn
      newParty.forEach((member, index) => {
        if (member.skillActive && member.skill.effect.type === 'damage_boost') {
          newParty[index] = {
            ...member,
            skillActive: false,
            skillDuration: 0
          };
        }
      });
      
      return newParty;
    });
  }, [gameState.inCombat, gameState.enemies, party, upgrades, setGameState, setParty]);

  return { processCombat };
};