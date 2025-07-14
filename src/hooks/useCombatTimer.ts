import { useEffect, useCallback } from 'react';
import { calculateCriticalHit } from '../combat/CriticalHitSystem';
import { selectTarget } from '../combat/CombatEngine';

interface PartyMember {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackTimer: number;
  attackSpeed?: number;
  skillActive?: boolean;
  skill?: any;
  skillDuration?: number;
  isProtected?: boolean;
}

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
  inCombat: boolean;
  enemies: Enemy[];
  currentFloor: number;
  currentGroup: number;
  groupsPerFloor: number;
  performingMassRes: boolean;
  massResurrectionTimer: number;
  enemyAttackTimer: number;
  attackTimer: number;
  totalRuns: number;
  runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
  healerProtected: boolean;
  combatLog: Array<{text: string, category: string, timestamp: number, isCritical?: boolean}>;
  gold: number;
  totalGoldEarned: number;
  gearsFound: number;
  monstersKilled: number;
}

interface CombatTimerHookProps {
  gameState: GameState;
  party: PartyMember[];
  gameSpeed: number;
  upgrades: any;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  setParty: (updater: (prev: PartyMember[]) => PartyMember[]) => void;
}

export const useCombatTimer = ({
  gameState,
  party,
  gameSpeed,
  upgrades,
  setGameState,
  setParty
}: CombatTimerHookProps) => {

  // Party attack timer processing
  useEffect(() => {
    if (!gameState.inCombat) return;
    
    // Check for party wipe conditions
    const aliveMembers = party.filter(member => member.hp > 0);
    const protectedHealer = party.find(member => member.role === 'healer' && member.isProtected);
    const nonHealerMembers = party.filter(member => member.role !== 'healer');
    const aliveNonHealers = nonHealerMembers.filter(member => member.hp > 0);
    
    // If everyone except protected healer is dead, start mass resurrection
    if (protectedHealer && aliveNonHealers.length === 0 && !gameState.performingMassRes) {
      setGameState(prev => ({
        ...prev,
        performingMassRes: true,
        massResurrectionTimer: 0,
        combatLog: [...prev.combatLog, { text: "🕊️ Healer begins Mass Resurrection ritual... (10 seconds)", category: 'special', timestamp: Date.now() }].slice(-3000)
      }));
    }
    
    // Normal party wipe (no protected healer)
    if (aliveMembers.length === 0) {
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
          healerProtected: false,
          massResurrectionTimer: 0,
          performingMassRes: false,
          combatLog: [...prev.combatLog, { text: "💀 Party wiped! Starting over...", category: 'status', timestamp: Date.now() }].slice(-3000)
        };
      });
      
      // Reset all party members to full health
      setParty(prev => prev.map(member => ({
        ...member,
        hp: member.maxHp,
        attackTimer: 0,
        isProtected: false // Reset healer protection
      })));
      return;
    }
    
    const timerInterval = setInterval(() => {
      setParty(prevParty => {
        let updatedParty = [...prevParty];
        let anyAttackProcessed = false;
        
        prevParty.forEach((member, memberIndex) => {
          if (member.hp <= 0) return; // Dead members don't attack
          if (member.role === 'healer' && member.isProtected) return; // Protected healer doesn't attack
          
          const attackSpeed = member.attackSpeed || 1.0;
          const increment = (100 / (gameSpeed / 100)) * attackSpeed;
          const newTimer = member.attackTimer + increment;
          
          if (newTimer >= 100) {
            // Member is ready to attack - process individual attack
            updatedParty[memberIndex] = { ...member, attackTimer: 0 };
            anyAttackProcessed = true;
            
            // Deactivate damage boost skill after attack
            if (member.skillActive && member.skill.effect.type === 'damage_boost') {
              updatedParty[memberIndex] = {
                ...updatedParty[memberIndex],
                skillActive: false,
                skillDuration: 0
              };
            }
            
            // Process this member's attack
            if (gameState.enemies.length > 0) {
              const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
              if (aliveEnemies.length > 0) {
                const targetEnemy = selectTarget(member, gameState.enemies);
                const baseDamage = Math.max(1, member.attack - targetEnemy.defense);
                const skillBoost = member.skillActive && member.skill.effect.type === 'damage_boost' ? member.skill.effect.value : 1;
                const boostedDamage = Math.floor(baseDamage * skillBoost);
                const { damage: finalDamage, isCritical } = calculateCriticalHit(boostedDamage);
                
                // Update enemy HP and check for combat completion
                setGameState(prevState => {
                  const updatedEnemies = prevState.enemies.map(enemy => 
                    enemy.id === targetEnemy.id 
                      ? { ...enemy, hp: Math.max(0, enemy.hp - finalDamage) }
                      : enemy
                  );
                  
                  // Check if this attack killed the enemy for rewards
                  const enemyWasKilled = targetEnemy.hp > 0 && (targetEnemy.hp - finalDamage) <= 0;
                  let goldEarned = 0;
                  let gearDrop = false;
                  
                  if (enemyWasKilled) {
                    // Calculate gold and gear rewards for killed enemy
                    goldEarned = Math.floor((3 + prevState.currentFloor) * (1 + upgrades.goldMultiplier * 0.1));
                    const gearDropChance = 0.15 + (prevState.currentFloor * 0.01) + (upgrades.gearDropBonus * 0.05);
                    gearDrop = Math.random() < gearDropChance;
                  }
                  
                  const aliveEnemies = updatedEnemies.filter(enemy => enemy.hp > 0);
                  
                  // Check if all enemies are defeated
                  if (aliveEnemies.length === 0) {
                    const newGroup = prevState.currentGroup + 1;
                    
                    // Reset party attack timers when combat ends
                    setParty(prevParty => prevParty.map(partyMember => ({
                      ...partyMember,
                      attackTimer: 0
                    })));
                    
                    if (newGroup > prevState.groupsPerFloor) {
                      // Floor completed, advance to next floor
                      return {
                        ...prevState,
                        inCombat: false,
                        enemies: [],
                        currentGroup: 1,
                        currentFloor: prevState.currentFloor + 1,
                        maxFloorReached: Math.max(prevState.maxFloorReached, prevState.currentFloor + 1),
                        gold: prevState.gold + goldEarned,
                        totalGoldEarned: prevState.totalGoldEarned + goldEarned,
                        gearsFound: prevState.gearsFound + (gearDrop ? 1 : 0),
                        monstersKilled: prevState.monstersKilled + 1,
                        performingMassRes: false,
                        massResurrectionTimer: 0,
                        healerProtected: false,
                        combatLog: [
                          ...prevState.combatLog,
                          { text: `${member.name} defeats ${targetEnemy.name}${isCritical ? ' with a CRITICAL HIT' : ''}! (${finalDamage} damage)`, category: 'combat', timestamp: Date.now(), isCritical },
                          ...(goldEarned > 0 ? [{ text: `💰 Found ${goldEarned} gold!`, category: 'rewards', timestamp: Date.now() }] : []),
                          ...(gearDrop ? [{ text: `⚔️ Found gear!`, category: 'rewards', timestamp: Date.now() }] : []),
                          { text: `🏆 Floor ${prevState.currentFloor} completed!`, category: 'progression', timestamp: Date.now() }
                        ].slice(-3000)
                      };
                    } else {
                      // Group completed, advance to next group
                      return {
                        ...prevState,
                        inCombat: false,
                        enemies: [],
                        currentGroup: newGroup,
                        gold: prevState.gold + goldEarned,
                        totalGoldEarned: prevState.totalGoldEarned + goldEarned,
                        gearsFound: prevState.gearsFound + (gearDrop ? 1 : 0),
                        monstersKilled: prevState.monstersKilled + 1,
                        performingMassRes: false,
                        massResurrectionTimer: 0,
                        healerProtected: false,
                        combatLog: [
                          ...prevState.combatLog,
                          { text: `${member.name} defeats ${targetEnemy.name}${isCritical ? ' with a CRITICAL HIT' : ''}! (${finalDamage} damage)`, category: 'combat', timestamp: Date.now(), isCritical },
                          ...(goldEarned > 0 ? [{ text: `💰 Found ${goldEarned} gold!`, category: 'rewards', timestamp: Date.now() }] : []),
                          ...(gearDrop ? [{ text: `⚔️ Found gear!`, category: 'rewards', timestamp: Date.now() }] : []),
                          { text: `⚔️ Group ${prevState.currentGroup} defeated!`, category: 'progression', timestamp: Date.now() }
                        ].slice(-3000)
                      };
                    }
                  } else {
                    // Combat continues
                    return {
                      ...prevState,
                      enemies: updatedEnemies,
                      gold: prevState.gold + goldEarned,
                      totalGoldEarned: prevState.totalGoldEarned + goldEarned,
                      gearsFound: prevState.gearsFound + (gearDrop ? 1 : 0),
                      monstersKilled: prevState.monstersKilled + (enemyWasKilled ? 1 : 0),
                      combatLog: [
                        ...prevState.combatLog,
                        { text: `${member.name} attacks ${targetEnemy.name}${isCritical ? ' with a CRITICAL HIT' : ''}! (${finalDamage} damage)`, category: 'combat', timestamp: Date.now(), isCritical },
                        ...(goldEarned > 0 ? [{ text: `💰 Found ${goldEarned} gold!`, category: 'rewards', timestamp: Date.now() }] : []),
                        ...(gearDrop ? [{ text: `⚔️ Found gear!`, category: 'rewards', timestamp: Date.now() }] : [])
                      ].slice(-3000)
                    };
                  }
                });
              }
            }
          } else {
            // Update timer but not ready to attack yet
            updatedParty[memberIndex] = { ...member, attackTimer: newTimer };
          }
        });
        
        return updatedParty;
      });
    }, 100);

    return () => clearInterval(timerInterval);
  }, [gameState.inCombat, party, gameSpeed, upgrades, setGameState, setParty]);

  // Enemy attack timer
  useEffect(() => {
    if (!gameState.inCombat || gameState.performingMassRes) return;

    const aliveEnemies = gameState.enemies.filter(enemy => enemy.hp > 0);
    if (aliveEnemies.length === 0) return;

    const enemyTimerInterval = setInterval(() => {
      const aliveMembers = party.filter(member => member.hp > 0);
      if (aliveMembers.length === 0) return;

      const avgEnemyAttackSpeed = aliveEnemies.reduce((sum, enemy) => sum + (enemy.attackSpeed || 1.0), 0) / aliveEnemies.length;
      const increment = (100 / (gameSpeed / 100)) * avgEnemyAttackSpeed;
      const newEnemyTimer = gameState.enemyAttackTimer + increment;

      if (newEnemyTimer >= 100) {
        // Enemy attack
        const targetMember = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        const totalEnemyAttack = aliveEnemies.reduce((sum, enemy) => sum + enemy.attack, 0);
        const damage = Math.max(1, totalEnemyAttack - targetMember.defense);

        setParty(prev => prev.map(member => 
          member.id === targetMember.id 
            ? { ...member, hp: Math.max(0, member.hp - damage) }
            : member
        ));

        setGameState(prev => ({
          ...prev,
          enemyAttackTimer: 0,
          combatLog: [...prev.combatLog, { text: `💀 Enemies attack ${targetMember.name} for ${damage} damage!`, category: 'combat', timestamp: Date.now() }].slice(-3000)
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          enemyAttackTimer: newEnemyTimer
        }));
      }
    }, 100);

    return () => clearInterval(enemyTimerInterval);
  }, [gameState.inCombat, gameState.performingMassRes, gameState.enemies, gameState.enemyAttackTimer, party, gameSpeed, setGameState, setParty]);
};