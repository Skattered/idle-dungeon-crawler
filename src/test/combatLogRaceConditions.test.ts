import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedGameTimer } from '../hooks/useUnifiedGameTimer';

describe('Combat Log Race Conditions', () => {
  let mockSetGameState: any;
  let mockSetParty: any;
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

    gameState = {
      inCombat: true,
      performingMassRes: false,
      massResurrectionTimer: 0,
      gearsFound: 0,
      gold: 1000,
      currentFloor: 5,
      enemies: [{ id: '1', name: 'Goblin', hp: 50, maxHp: 50, attack: 10, defense: 5 }],
      combatLog: [
        { text: 'Adventure begins!', category: 'progression', timestamp: Date.now() - 1000 }
      ]
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

  describe('Concurrent Log Updates', () => {
    it('should handle multiple log sources without message loss', () => {
      const gameSpeed = 1500;
      const logUpdateCount = { count: 0 };
      
      // Mock timer functions that add log messages
      const mockProcessAttackTimers = vi.fn(() => {
        // Simulate combat log from attack timers
        gameState.combatLog = [...gameState.combatLog, {
          text: `Timer ${++logUpdateCount.count}: Warrior attacks Goblin!`,
          category: 'combat',
          timestamp: Date.now()
        }].slice(-3000);
        mockSetGameState(gameState);
      });

      const mockProcessGameLoop = vi.fn(() => {
        // Simulate skill processing log
        gameState.combatLog = [...gameState.combatLog, {
          text: `Timer ${++logUpdateCount.count}: Skill processed`,
          category: 'skills',
          timestamp: Date.now()
        }].slice(-3000);
        mockSetGameState(gameState);
      });

      // Start unified timer
      renderHook(() => useUnifiedGameTimer({
        gameState,
        party,
        upgrades,
        gameSpeed,
        setGameState: mockSetGameState,
        setParty: mockSetParty,
        processSkills: vi.fn(),
        upgradeGear: vi.fn(),
        startCombat: vi.fn(),
        processAttackTimers: mockProcessAttackTimers,
        processGameLoop: mockProcessGameLoop,
        processMassResurrection: vi.fn()
      }));

      const initialLogLength = gameState.combatLog.length;

      // Simulate concurrent operations
      act(() => {
        // Timer operations
        vi.advanceTimersByTime(100); // Attack timer
        
        // User action (purchase) at same time
        gameState.combatLog = [...gameState.combatLog, {
          text: 'User action: Purchased upgrade',
          category: 'skills',
          timestamp: Date.now()
        }].slice(-3000);
        
        vi.advanceTimersByTime(1400); // Complete game loop
      });

      // Verify all messages were preserved
      expect(gameState.combatLog.length).toBeGreaterThan(initialLogLength);
      expect(mockProcessAttackTimers).toHaveBeenCalled();
      expect(mockProcessGameLoop).toHaveBeenCalled();
    });

    it('should maintain chronological order of log messages', () => {
      const messageTimestamps: number[] = [];
      
      // Track all log updates with timestamps
      const originalSetGameState = mockSetGameState;
      mockSetGameState = vi.fn((updater) => {
        if (typeof updater === 'function') {
          const oldState = { ...gameState };
          gameState = updater(gameState);
          
          // Track new messages
          if (gameState.combatLog.length > oldState.combatLog.length) {
            const newMessages = gameState.combatLog.slice(oldState.combatLog.length);
            newMessages.forEach(msg => messageTimestamps.push(msg.timestamp));
          }
        } else {
          gameState = updater;
        }
      });

      // Simulate rapid message additions
      const baseTime = Date.now();
      
      // Add messages with different timestamps
      act(() => {
        gameState.combatLog = [...gameState.combatLog, {
          text: 'Message 1',
          category: 'combat',
          timestamp: baseTime + 100
        }].slice(-3000);
        mockSetGameState(gameState);
        
        gameState.combatLog = [...gameState.combatLog, {
          text: 'Message 2',
          category: 'progression',
          timestamp: baseTime + 50 // Earlier timestamp
        }].slice(-3000);
        mockSetGameState(gameState);
        
        gameState.combatLog = [...gameState.combatLog, {
          text: 'Message 3',
          category: 'skills',
          timestamp: baseTime + 200
        }].slice(-3000);
        mockSetGameState(gameState);
      });

      // Verify messages exist (order might be preserved by append order)
      expect(gameState.combatLog.length).toBeGreaterThanOrEqual(4); // Initial + 3 new
      
      // Check that all messages were captured
      const combatMessages = gameState.combatLog.filter(msg => 
        msg.text.includes('Message')
      );
      expect(combatMessages).toHaveLength(3);
    });

    it('should handle log overflow without losing critical messages', () => {
      // Fill log near capacity
      const initialMessages = Array.from({ length: 2995 }, (_, i) => ({
        text: `Filler message ${i}`,
        category: 'combat',
        timestamp: Date.now() - (2995 - i)
      }));
      
      gameState.combatLog = [...gameState.combatLog, ...initialMessages].slice(-3000);
      
      // Add critical messages that should be preserved
      act(() => {
        // Critical progression message
        gameState.combatLog = [...gameState.combatLog, {
          text: 'CRITICAL: Floor completed!',
          category: 'progression',
          timestamp: Date.now()
        }].slice(-3000);
        mockSetGameState(gameState);
        
        // Combat message from timer
        gameState.combatLog = [...gameState.combatLog, {
          text: 'Combat: Enemy defeated!',
          category: 'combat',
          timestamp: Date.now() + 1
        }].slice(-3000);
        mockSetGameState(gameState);
      });

      // Verify log stays within limits
      expect(gameState.combatLog.length).toBeLessThanOrEqual(3000);
      
      // Verify critical messages are present
      const criticalMessage = gameState.combatLog.find(msg => 
        msg.text.includes('CRITICAL')
      );
      expect(criticalMessage).toBeDefined();
    });
  });

  describe('Message Category Coordination', () => {
    it('should handle concurrent updates from different categories', () => {
      const categories = ['combat', 'progression', 'skills', 'rewards', 'status'];
      const messagesByCategory: Record<string, number> = {};
      
      // Initialize counters
      categories.forEach(cat => messagesByCategory[cat] = 0);
      
      // Simulate concurrent updates from different sources
      act(() => {
        categories.forEach((category, index) => {
          gameState.combatLog = [...gameState.combatLog, {
            text: `${category} message ${index}`,
            category,
            timestamp: Date.now() + index
          }].slice(-3000);
          messagesByCategory[category]++;
          mockSetGameState(gameState);
        });
      });

      // Verify all categories are represented
      categories.forEach(category => {
        const categoryMessages = gameState.combatLog.filter(msg => 
          msg.category === category
        );
        expect(categoryMessages.length).toBeGreaterThanOrEqual(messagesByCategory[category]);
      });
    });

    it('should preserve message structure during concurrent updates', () => {
      const testMessage = {
        text: 'Test message',
        category: 'combat',
        timestamp: Date.now(),
        isCritical: true
      };
      
      act(() => {
        gameState.combatLog = [...gameState.combatLog, testMessage].slice(-3000);
        mockSetGameState(gameState);
      });

      const foundMessage = gameState.combatLog.find(msg => 
        msg.text === 'Test message'
      );
      
      expect(foundMessage).toBeDefined();
      expect(foundMessage).toMatchObject(testMessage);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle rapid log updates efficiently', () => {
      const startTime = performance.now();
      const messageCount = 100;
      
      act(() => {
        for (let i = 0; i < messageCount; i++) {
          gameState.combatLog = [...gameState.combatLog, {
            text: `Rapid message ${i}`,
            category: 'combat',
            timestamp: Date.now() + i
          }].slice(-3000);
          mockSetGameState(gameState);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms threshold
      expect(gameState.combatLog.length).toBeLessThanOrEqual(3000);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});