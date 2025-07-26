import { useRef, useCallback } from 'react';
import { calculateCriticalHit } from '../combat/CriticalHitSystem';
import { selectTarget } from '../combat/CombatEngine';
import { generateTacticalMessage } from '../combat/CombatMessage';
import { useProgressionSystem } from './useProgressionSystem';
import { CombatLogManager } from '../utils/CombatLogManager';
import { useGameStore } from '../store/gameStore';

interface UseAttackTimersStoreParams {
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
  setParty: (updater: (prev: any[]) => any[]) => void;
}

export const useAttackTimersStore = ({ 
  party, 
  upgrades, 
  gameSpeed, 
  setParty
}: UseAttackTimersStoreParams) => {
  const hasAdvancedThisCombat = useRef(false);
  
  // Store selectors - individual selectors to prevent object recreation
  const inCombat = useGameStore((state) => state.combat.inCombat);
  const enemies = useGameStore((state) => state.combat.enemies);
  const currentFloor = useGameStore((state) => state.game.currentFloor);
  const currentGroup = useGameStore((state) => state.game.currentGroup);
  const totalGroupsPerFloor = useGameStore((state) => state.game.totalGroupsPerFloor);
  const shieldWallActive = useGameStore((state) => state.combat.shieldWallActive);
  const shieldWallTurns = useGameStore((state) => state.combat.shieldWallTurns);
  const performingMassRes = useGameStore((state) => state.combat.performingMassRes);
  const massResurrectionTimer = useGameStore((state) => state.combat.massResurrectionTimer);
  const enemyAttackTimer = useGameStore((state) => state.combat.enemyAttackTimer);
  const healerProtected = useGameStore((state) => state.combat.healerProtected);
  
  const actions = useGameStore((state) => state.actions);
  
  const { resetToFloorOne } = useProgressionSystem({
    gameState: {
      inCombat,
      enemies,
      currentFloor,
      currentGroup,
      totalGroupsPerFloor,
      shieldWallActive,
      shieldWallTurns,
      performingMassRes,
      massResurrectionTimer,
      enemyAttackTimer,
      healerProtected,
      totalRuns: 0, // Will be added from store later
      runHistory: [],
      combatLog: [],
      maxFloorReached: 0,
      monstersKilled: 0,
      gold: 0,
      totalGoldEarned: 0,
      gearsFound: 0,
      attackTimer: 0
    },
    upgrades,
    setGameState: () => {}, // Legacy compatibility
    setParty
  });
  
  // Store refs to avoid timer restarts
  const currentGameSpeed = useRef(gameSpeed);
  currentGameSpeed.current = gameSpeed;
  
  const processAttackTimers = useCallback(() => {
    if (!inCombat) return;
    
    const aliveMembers = party.filter(member => member.hp > 0);
    
    // Check for party wipe with protected healer
    if (aliveMembers.length === 1 && aliveMembers[0].role === 'healer' && aliveMembers[0].isProtected) {
      if (!performingMassRes) {
        // Start mass resurrection using store action
        queueMicrotask(() => {
          actions.setMassResurrection(true, 0);
        });
        
        // Add mass resurrection message through CombatLogManager
        CombatLogManager.addMessage({
          text: "🕊️ Healer begins Mass Resurrection ritual... (10 seconds)",
          category: 'special',
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Normal party wipe (no protected healer)
    if (aliveMembers.length === 0) {
      resetToFloorOne('wipe');
      return;
    }
    
    // Process party member attack timers atomically
    setParty(prevParty => {
      let updatedParty = [...prevParty];
      let attacksToProcess: Array<{memberIndex: number, member: any}> = [];
      
      prevParty.forEach((member, memberIndex) => {
        if (member.hp <= 0) return; // Dead members don't attack
        if ((member.role || '') === 'healer' && member.isProtected) return; // Protected healer doesn't attack
        
        const attackSpeed = member.attackSpeed || 1.0;
        const increment = (100 / (currentGameSpeed.current / 100)) * attackSpeed;
        const newTimer = member.attackTimer + increment;
        
        if (newTimer >= 100) {
          // Member is ready to attack
          updatedParty[memberIndex] = { ...member, attackTimer: 0 };
          
          // Deactivate damage boost skill after attack
          if (member.skillActive && member.skill.effect.type === 'damage_boost') {
            updatedParty[memberIndex] = {
              ...updatedParty[memberIndex],
              skillActive: false,
              skillDuration: 0
            };
          }
          
          // Queue this attack for processing
          attacksToProcess.push({ memberIndex, member: updatedParty[memberIndex] });
        } else {
          updatedParty[memberIndex] = { ...member, attackTimer: newTimer };
        }
      });
      
      // Process all queued attacks using store actions (atomic operations)
      const attackActions: Array<() => void> = [];
      
      attacksToProcess.forEach(({ member }) => {
        if (enemies.length > 0) {
          const aliveEnemies = enemies.filter(e => e.hp > 0);
          if (aliveEnemies.length > 0) {
            const targetEnemy = selectTarget(member, enemies);
            const baseDamage = Math.max(1, member.attack - targetEnemy.defense);
            const skillBoost = member.skillActive && member.skill.effect.type === 'damage_boost' ? member.skill.effect.value : 1;
            const boostedDamage = Math.floor(baseDamage * skillBoost);
            const { damage: finalDamage, isCritical } = calculateCriticalHit(boostedDamage);
            
            // Add combat message through CombatLogManager
            const tacticalMessage = generateTacticalMessage(member, targetEnemy, finalDamage, isCritical, skillBoost);
            CombatLogManager.addMessage({ 
              text: tacticalMessage, 
              category: 'combat', 
              timestamp: Date.now(),
              isCritical 
            });
            
            // Queue the attack action
            attackActions.push(() => {
              actions.damageEnemy(targetEnemy.id, finalDamage);
            });
          }
        }
      });
      
      // Process all attacks at once, then check for combat completion
      if (attackActions.length > 0) {
        queueMicrotask(() => {
          // Execute all attacks
          attackActions.forEach(action => action());
          
          // Single check for combat completion after all attacks
          setTimeout(() => {
            const state = useGameStore.getState();
            const remainingEnemies = state.combat.enemies.filter(e => e.hp > 0);
            
            if (remainingEnemies.length === 0 && !hasAdvancedThisCombat.current) {
              hasAdvancedThisCombat.current = true;
              
              // Add combat completion message
              CombatLogManager.addMessage({
                text: `✅ Group ${currentGroup}/${totalGroupsPerFloor} completed! Next: Group ${currentGroup + 1}`,
                category: 'progression',
                timestamp: Date.now()
              });
              
              // Use atomic store action for group completion
              actions.completeGroup();
            }
          }, 10);
        });
      }
      
      return updatedParty;
    });
    
    // Process enemy attacks using store actions
    if (enemies.length > 0 && enemyAttackTimer >= 100) {
      const aliveEnemies = enemies.filter(e => e.hp > 0);
      const alivePartyMembers = party.filter(member => member.hp > 0);
      
      if (aliveEnemies.length > 0 && alivePartyMembers.length > 0) {
        aliveEnemies.forEach(enemy => {
          const targetMember = selectTarget({ role: 'enemy' }, alivePartyMembers);
          if (!targetMember) return;
          
          // Calculate damage with shield wall protection
          let damage = Math.max(1, enemy.attack - targetMember.defense);
          if (shieldWallActive) {
            damage = Math.floor(damage * 0.5); // Shield Wall reduces damage by 50%
          }
          
          // Apply damage to party member with healer protection logic
          let healerProtectionActivated = false;
          setParty(prevParty => {
            return prevParty.map(member => {
              if (member.name !== targetMember.name) return member;
              
              const newHp = member.hp - damage;
              
              // Healer protection: If healer would die, activate protection instead
              if (member.role === 'healer' && newHp <= 0 && !member.isProtected) {
                healerProtectionActivated = true;
                return {
                  ...member,
                  hp: 1, // Keep healer alive with 1 HP
                  isProtected: true
                };
              }
              
              // Protected healer takes no damage
              if (member.role === 'healer' && member.isProtected) {
                return member; // No damage to protected healer
              }
              
              // Normal damage application
              return {
                ...member,
                hp: Math.max(0, newHp)
              };
            });
          });
          
          // Add healer protection message if activated
          if (healerProtectionActivated) {
            queueMicrotask(() => {
              actions.setCombatState({ healerProtected: true });
            });
            CombatLogManager.addMessage({
              text: `🛡️ ${targetMember.name} casts Divine Protection! Healer is now frozen in time until party revival.`,
              category: 'special',
              timestamp: Date.now()
            });
          }
          
          // Add enemy attack message
          CombatLogManager.addMessage({
            text: `🦹 ${enemy.name} attacks ${targetMember.name} for ${damage} damage${shieldWallActive ? ' (Shield Wall)' : ''}`,
            category: 'combat',
            timestamp: Date.now()
          });
        });
        
        // Reset enemy attack timer using store action
        queueMicrotask(() => {
          actions.setCombatState({ enemyAttackTimer: 0 });
        });
        
        // Decrement shield wall turns if active
        if (shieldWallActive && shieldWallTurns > 0) {
          const newTurns = shieldWallTurns - 1;
          if (newTurns <= 0) {
            queueMicrotask(() => {
              actions.setShieldWall(false, 0);
            });
            CombatLogManager.addMessage({
              text: "🛡️ Shield Wall expires!",
              category: 'status',
              timestamp: Date.now()
            });
          } else {
            queueMicrotask(() => {
              actions.setShieldWall(true, newTurns);
            });
          }
        }
      }
    } else if (inCombat) {
      // Increment enemy attack timer using store action
      const increment = 100 / (currentGameSpeed.current / 100);
      queueMicrotask(() => {
        actions.setCombatState({ 
          enemyAttackTimer: Math.min(100, enemyAttackTimer + increment) 
        });
      });
    }
    
    // Reset combat advancement flag when combat starts (not ends)
    if (inCombat && hasAdvancedThisCombat.current) {
      hasAdvancedThisCombat.current = false;
    }
  }, [
    inCombat,
    enemies,
    shieldWallActive,
    shieldWallTurns,
    performingMassRes,
    enemyAttackTimer,
    currentGroup,
    totalGroupsPerFloor,
    party, 
    actions, 
    setParty, 
    resetToFloorOne
  ]);

  return { processAttackTimers };
};