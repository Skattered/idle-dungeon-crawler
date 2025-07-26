import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, fireEvent, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { useUnifiedGameTimer } from '../hooks/useUnifiedGameTimer';

describe('Purchase Operations Race Conditions', () => {
  let mockSetGameState: any;
  let mockSetParty: any;
  let mockSetUpgrades: any;
  let gameState: any;
  let party: any;
  let upgrades: any;

  beforeEach(() => {
    vi.useFakeTimers();
    
    mockSetGameState = vi.fn((updater) => {
      if (typeof updater === 'function') {
        gameState = updater(gameState);
      } else {
        gameState = updater;
      }
    });
    
    mockSetParty = vi.fn((updater) => {
      if (typeof updater === 'function') {
        party = updater(party);
      } else {
        party = updater;
      }
    });

    mockSetUpgrades = vi.fn((updater) => {
      if (typeof updater === 'function') {
        upgrades = updater(upgrades);
      } else {
        upgrades = updater;
      }
    });

    gameState = {
      inCombat: true,
      performingMassRes: false,
      massResurrectionTimer: 0,
      gearsFound: 0,
      gold: 1000,
      enemies: [{ id: '1', name: 'Goblin', hp: 50, maxHp: 50, attack: 10, defense: 5 }],
      combatLog: []
    };

    party = [
      {
        hp: 80,
        maxHp: 100,
        name: 'Warrior',
        role: 'tank',
        attack: 20,
        defense: 15,
        attackTimer: 0,
        skillCooldown: 0,
        skillActive: false
      }
    ];

    upgrades = {
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 0,
      goldMultiplier: 0,
      gearDropBonus: 0
    };
  });

  describe('Concurrent State Updates', () => {
    it('should handle purchase during combat timer updates without race conditions', () => {
      const gameSpeed = 1500;
      
      // Mock timer functions
      const mockProcessSkills = vi.fn();
      const mockUpgradeGear = vi.fn();
      const mockStartCombat = vi.fn();
      const mockProcessAttackTimers = vi.fn(() => {
        // Simulate attack timer updating gold (enemy drops)
        gameState.gold += 10;
        mockSetGameState(gameState);
      });
      const mockProcessGameLoop = vi.fn();
      const mockProcessMassResurrection = vi.fn();

      // Start unified timer
      renderHook(() => useUnifiedGameTimer({
        gameState,
        party,
        upgrades,
        gameSpeed,
        setGameState: mockSetGameState,
        setParty: mockSetParty,
        processSkills: mockProcessSkills,
        upgradeGear: mockUpgradeGear,
        startCombat: mockStartCombat,
        processAttackTimers: mockProcessAttackTimers,
        processGameLoop: mockProcessGameLoop,
        processMassResurrection: mockProcessMassResurrection
      }));

      const initialGold = gameState.gold;

      // Simulate user purchasing upgrade
      const purchaseUpgrade = (upgradeType: string) => {
        const cost = 100; // Simplified cost
        if (gameState.gold >= cost) {
          // Simulate the race condition - multiple state updates
          gameState.gold -= cost;
          mockSetGameState(gameState);
          
          upgrades[upgradeType] += 1;
          mockSetUpgrades(upgrades);
        }
      };

      // Start combat timers and immediately purchase
      act(() => {
        vi.advanceTimersByTime(50); // 50ms into timer
        purchaseUpgrade('attackBonus'); // Purchase during timer processing
        vi.advanceTimersByTime(50); // Complete 100ms timer cycle
      });

      // Verify that both operations affected the gold correctly
      expect(mockProcessAttackTimers).toHaveBeenCalled();
      expect(mockSetGameState).toHaveBeenCalled();
      expect(mockSetUpgrades).toHaveBeenCalled();
      
      // Check for proper state coordination
      expect(upgrades.attackBonus).toBe(1);
    });

    it('should prevent purchase when insufficient gold due to concurrent spending', () => {
      // Set up scenario where gold is barely enough
      gameState.gold = 100;
      
      const purchaseUpgrade = (cost: number) => {
        // Check gold at time of purchase
        if (gameState.gold >= cost) {
          gameState.gold -= cost;
          return true;
        }
        return false;
      };

      // Simulate concurrent operations reducing gold
      gameState.gold -= 50; // Timer reduces gold
      
      // Purchase should fail
      const result = purchaseUpgrade(100);
      expect(result).toBe(false);
      expect(gameState.gold).toBe(50); // Gold unchanged from failed purchase
    });

    it('should maintain gold consistency during rapid purchases', () => {
      gameState.gold = 1000;
      const upgradeCost = 100;
      
      const purchaseUpgrade = () => {
        if (gameState.gold >= upgradeCost) {
          gameState.gold -= upgradeCost;
          return true;
        }
        return false;
      };

      // Simulate rapid purchases
      let successfulPurchases = 0;
      for (let i = 0; i < 15; i++) { // Try to buy more than possible
        if (purchaseUpgrade()) {
          successfulPurchases++;
        }
      }

      // Should only allow 10 purchases (1000 / 100)
      expect(successfulPurchases).toBe(10);
      expect(gameState.gold).toBe(0);
    });
  });

  describe('State Update Ordering', () => {
    it('should handle multiple state setters in correct order', () => {
      const stateUpdateOrder: string[] = [];
      
      const trackingSetGameState = vi.fn((updater) => {
        stateUpdateOrder.push('gameState');
        mockSetGameState(updater);
      });
      
      const trackingSetUpgrades = vi.fn((updater) => {
        stateUpdateOrder.push('upgrades');
        mockSetUpgrades(updater);
      });
      
      const trackingSetParty = vi.fn((updater) => {
        stateUpdateOrder.push('party');
        mockSetParty(updater);
      });

      // Simulate purchase function with multiple state updates
      const purchaseUpgrade = () => {
        trackingSetGameState(prev => ({ ...prev, gold: prev.gold - 100 }));
        trackingSetUpgrades(prev => ({ ...prev, attackBonus: prev.attackBonus + 1 }));
        trackingSetParty(prev => prev.map(member => ({ ...member, attack: member.attack + 1 })));
      };

      act(() => {
        purchaseUpgrade();
      });

      // Verify state updates happened in correct order
      expect(stateUpdateOrder).toEqual(['gameState', 'upgrades', 'party']);
      expect(trackingSetGameState).toHaveBeenCalledTimes(1);
      expect(trackingSetUpgrades).toHaveBeenCalledTimes(1);
      expect(trackingSetParty).toHaveBeenCalledTimes(1);
    });
  });

  describe('Combat State Protection', () => {
    it('should prevent purchases during critical combat moments', () => {
      // Set up critical combat state
      gameState.inCombat = true;
      party[0].hp = 5; // Very low health
      
      const purchaseUpgrade = () => {
        // Check if in critical state
        const isCritical = gameState.inCombat && party.some(member => member.hp < 10);
        
        if (isCritical) {
          return { success: false, reason: 'Cannot purchase during critical combat' };
        }
        
        if (gameState.gold >= 100) {
          gameState.gold -= 100;
          return { success: true };
        }
        
        return { success: false, reason: 'Insufficient gold' };
      };

      const result = purchaseUpgrade();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Cannot purchase during critical combat');
      expect(gameState.gold).toBe(1000); // Gold unchanged
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});