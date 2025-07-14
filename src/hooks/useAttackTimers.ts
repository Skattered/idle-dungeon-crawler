import { useEffect } from 'react';
import { calculateCriticalHit } from '../combat/CriticalHitSystem';
import { selectTarget } from '../combat/CombatEngine';
import { generateTacticalMessage } from '../combat/CombatMessage';

interface UseAttackTimersParams {
  gameState: {
    inCombat: boolean;
    enemies: Array<{id: string, name: string, hp: number, maxHp: number, attack: number, defense: number, attackSpeed?: number, attackTimer?: number}>;
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
    performingMassRes: boolean;
    massResurrectionTimer: number;
    enemyAttackTimer: number;
    healerProtected: boolean;
  };
  party: Array<{
    hp: number;
    maxHp: number;
    name: string;
    role: string;
    attack: number;
    defense: number;
    attackTimer: number;
    attackSpeed?: number;
    skillActive: boolean;
    skill: { effect: { type: string; value: number } };
    isProtected?: boolean;
  }>;
  upgrades: {
    goldMultiplier: number;
    gearDropBonus: number;
  };
  gameSpeed: number;
  setGameState: (updater: (prev: any) => any) => void;
  setParty: (updater: (prev: any[]) => any[]) => void;
}

export const useAttackTimers = ({ 
  gameState, 
  party, 
  upgrades, 
  gameSpeed, 
  setGameState, 
  setParty 
}: UseAttackTimersParams) => {
  
  useEffect(() => {
    if (!gameState.inCombat) return;
    
    // Check for party wipe
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
                        monstersKilled: prevState.monstersKilled + (enemyWasKilled ? 1 : 0),
                        gold: prevState.gold + goldEarned,
                        totalGoldEarned: prevState.totalGoldEarned + goldEarned,
                        gearsFound: prevState.gearsFound + (gearDrop ? 1 : 0),
                        combatLog: [...prevState.combatLog, 
                          { text: `${generateTacticalMessage(member, targetEnemy, finalDamage, isCritical, skillBoost)}${enemyWasKilled ? ` - ${targetEnemy.name} defeated!${goldEarned > 0 ? ` +${goldEarned} gold` : ''}${gearDrop ? ' 🎁 Gear found!' : ''}` : ''}`, category: 'combat', timestamp: Date.now() },
                          { text: `🏆 Floor ${prevState.currentFloor} completed!`, category: 'progression', timestamp: Date.now() }
                        ].slice(-3000)
                      };
                    } else {
                      // Next group on same floor
                      return {
                        ...prevState,
                        inCombat: false,
                        enemies: [],
                        currentGroup: newGroup,
                        monstersKilled: prevState.monstersKilled + (enemyWasKilled ? 1 : 0),
                        gold: prevState.gold + goldEarned,
                        totalGoldEarned: prevState.totalGoldEarned + goldEarned,
                        gearsFound: prevState.gearsFound + (gearDrop ? 1 : 0),
                        combatLog: [...prevState.combatLog, 
                          { text: `${generateTacticalMessage(member, targetEnemy, finalDamage, isCritical, skillBoost)}${enemyWasKilled ? ` - ${targetEnemy.name} defeated!${goldEarned > 0 ? ` +${goldEarned} gold` : ''}${gearDrop ? ' 🎁 Gear found!' : ''}` : ''}`, category: 'combat', timestamp: Date.now() },
                          { text: `✅ Group ${prevState.currentGroup} defeated!`, category: 'progression', timestamp: Date.now() }
                        ].slice(-3000)
                      };
                    }
                  }
                  
                  // Normal attack result - combat continues
                  return {
                    ...prevState,
                    enemies: updatedEnemies,
                    monstersKilled: prevState.monstersKilled + (enemyWasKilled ? 1 : 0),
                    gold: prevState.gold + goldEarned,
                    totalGoldEarned: prevState.totalGoldEarned + goldEarned,
                    gearsFound: prevState.gearsFound + (gearDrop ? 1 : 0),
                    combatLog: [...prevState.combatLog, { 
                      text: `${generateTacticalMessage(member, targetEnemy, finalDamage, isCritical, skillBoost)}${enemyWasKilled ? ` - ${targetEnemy.name} defeated!${goldEarned > 0 ? ` +${goldEarned} gold` : ''}${gearDrop ? ' 🎁 Gear found!' : ''}` : ''}`, 
                      category: enemyWasKilled ? 'rewards' : 'combat', 
                      timestamp: Date.now() 
                    }].slice(-3000)
                  };
                });
              }
            }
          } else {
            updatedParty[memberIndex] = { ...member, attackTimer: newTimer };
          }
        });
        
        return updatedParty;
      });
      
      // Update individual enemy attack timers
      setGameState(prevState => {
        if (!prevState.inCombat || !prevState.enemies || prevState.enemies.length === 0) {
          return prevState;
        }
        
        const aliveEnemies = prevState.enemies.filter(enemy => enemy.hp > 0);
        if (aliveEnemies.length === 0) return prevState;
        
        let updatedEnemies = [...prevState.enemies];
        let combatMessages = [];
        let anyEnemyAttacked = false;
        
        // Process each alive enemy's attack timer
        aliveEnemies.forEach((enemy, index) => {
          const enemyIndex = prevState.enemies.findIndex(e => e.id === enemy.id);
          if (enemyIndex === -1) return;
          
          const attackSpeed = enemy.attackSpeed || 1.0;
          const increment = (100 / (gameSpeed / 100)) * attackSpeed;
          const newTimer = (enemy.attackTimer || 0) + increment;
          
          if (newTimer >= 100 && !prevState.performingMassRes) {
            // This enemy is ready to attack
            updatedEnemies[enemyIndex] = { ...enemy, attackTimer: 0 };
            anyEnemyAttacked = true;
            
            const alivePartyMembers = party.filter(member => member.hp > 0);
            if (alivePartyMembers.length > 0) {
              // Calculate individual enemy damage
              const partyDefense = party.reduce((sum, member) => sum + member.defense, 0);
              let baseDamage = Math.max(1, enemy.attack - Math.floor(partyDefense / party.length));
              
              // Apply Shield Wall damage reduction
              if (prevState.shieldWallActive && prevState.shieldWallTurns > 0) {
                baseDamage = Math.floor(baseDamage * 0.5);
              }
              
              // Calculate critical hit for this enemy's attack
              const { damage: enemyDamage, isCritical: enemyCrit } = calculateCriticalHit(baseDamage);
              
              // Select random party member to attack
              const targetMember = alivePartyMembers[Math.floor(Math.random() * alivePartyMembers.length)];
              let healerProtectionActivated = false;
              
              // Apply damage to target
              setParty(prevParty => {
                return prevParty.map(member => {
                  if (member.name === targetMember.name) {
                    const newHp = member.hp - enemyDamage;
                    
                    // Check if healer would die and activate protection
                    if (member.role === 'healer' && newHp <= 0 && !member.isProtected) {
                      healerProtectionActivated = true;
                      return { 
                        ...member, 
                        hp: 1, // Keep healer alive with 1 HP
                        isProtected: true // Mark as protected
                      };
                    }
                    
                    // Protected healer takes no damage
                    if (member.role === 'healer' && member.isProtected) {
                      return member; // No damage to protected healer
                    }
                    
                    return { ...member, hp: Math.max(0, newHp) };
                  }
                  return member;
                });
              });
              
              // Add combat message for this individual enemy attack
              combatMessages.push({ 
                text: `⚔️ ${enemy.name} attacks ${targetMember.name} for ${enemyDamage} damage!${enemyCrit ? ' 💥 CRITICAL!' : ''}${prevState.shieldWallActive ? ' (Shield Wall active)' : ''}`, 
                category: 'combat', 
                timestamp: Date.now() 
              });
              
              if (healerProtectionActivated) {
                combatMessages.push({ 
                  text: `🛡️ ${targetMember.name} casts Divine Protection! Healer is now frozen in time until party revival.`, 
                  category: 'special', 
                  timestamp: Date.now() 
                });
                setGameState(prev => ({ ...prev, healerProtected: true }));
              }
            }
          } else {
            updatedEnemies[enemyIndex] = { ...enemy, attackTimer: newTimer };
          }
        });
        
        // Handle Shield Wall duration if any enemy attacked
        if (anyEnemyAttacked && prevState.shieldWallActive && prevState.shieldWallTurns > 0) {
          return {
            ...prevState,
            enemies: updatedEnemies,
            shieldWallTurns: prevState.shieldWallTurns - 1,
            shieldWallActive: prevState.shieldWallTurns > 1,
            combatLog: [...prevState.combatLog, ...combatMessages].slice(-3000)
          };
        }
        
        return {
          ...prevState,
          enemies: updatedEnemies,
          combatLog: [...prevState.combatLog, ...combatMessages].slice(-3000)
        };
      });
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(timerInterval);
  }, [gameState.inCombat, gameSpeed, gameState.enemies, party, upgrades, setGameState, setParty]);
};