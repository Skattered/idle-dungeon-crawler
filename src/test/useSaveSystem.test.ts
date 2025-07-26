import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSaveSystem } from '../hooks/useSaveSystem';
import { SaveSystem } from '../utils/SaveSystem';
import { CombatLogManager } from '../utils/CombatLogManager';

// Mock the SaveSystem and CombatLogManager
vi.mock('../utils/SaveSystem');
vi.mock('../utils/CombatLogManager');
vi.mock('../utils/Environment', () => ({
  isProd: vi.fn(() => false)
}));

const MockSaveSystem = SaveSystem as any;
const MockCombatLogManager = CombatLogManager as any;

describe('useSaveSystem hook', () => {
  const mockGameState = {
    currentFloor: 3,
    maxFloorReached: 3,
    currentGroup: 2,
    gold: 500,
    totalRuns: 1,
    runHistory: [],
    combatLog: []
  };

  const mockParty = [
    { name: 'Tank', class: 'tank', level: 3, hp: 150, maxHp: 150 }
  ];

  const mockUpgrades = {
    attackBonus: 2,
    defenseBonus: 1,
    healthBonus: 1,
    goldMultiplier: 1,
    gearDropBonus: 0
  };

  const mockSetters = {
    setGameState: vi.fn(),
    setParty: vi.fn(),
    setUpgrades: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MockSaveSystem.loadGame.mockReturnValue(null);
    MockSaveSystem.startAutoSave.mockImplementation(() => {});
    MockSaveSystem.stopAutoSave.mockImplementation(() => {});
    MockSaveSystem.exportToString.mockReturnValue('mock-export-string');
    MockSaveSystem.importFromString.mockReturnValue({
      gameState: mockGameState,
      party: mockParty,
      upgrades: mockUpgrades
    });
    MockSaveSystem.manualSave.mockImplementation(() => {});
    MockCombatLogManager.addMessage.mockImplementation(() => {});
  });

  describe('initialization and loading', () => {
    test('should load save data on mount when available', () => {
      const mockSaveData = {
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades
      };
      
      MockSaveSystem.loadGame.mockReturnValue(mockSaveData);

      renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      expect(MockSaveSystem.loadGame).toHaveBeenCalled();
      expect(mockSetters.setGameState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetters.setParty).toHaveBeenCalledWith(expect.any(Array)); // Party is recalculated with stats
      expect(mockSetters.setUpgrades).toHaveBeenCalledWith(mockUpgrades);
    });

    test('should not crash when no save data exists', () => {
      MockSaveSystem.loadGame.mockReturnValue(null);

      expect(() => {
        renderHook(() => useSaveSystem({
          gameState: mockGameState,
          party: mockParty,
          upgrades: mockUpgrades,
          ...mockSetters
        }));
      }).not.toThrow();

      expect(MockSaveSystem.loadGame).toHaveBeenCalled();
    });
  });

  describe('autosave functionality', () => {
    test('should start autosave in production', async () => {
      const { isProd } = await import('../utils/Environment');
      vi.mocked(isProd).mockReturnValue(true);

      renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      expect(MockSaveSystem.startAutoSave).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should start autosave in development', async () => {
      const { isProd } = await import('../utils/Environment');
      vi.mocked(isProd).mockReturnValue(false);

      renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      expect(MockSaveSystem.startAutoSave).toHaveBeenCalled();
    });

    test('should stop autosave on cleanup', async () => {
      const { isProd } = await import('../utils/Environment');
      vi.mocked(isProd).mockReturnValue(true);

      const { unmount } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      unmount();

      expect(MockSaveSystem.stopAutoSave).toHaveBeenCalled();
    });
  });

  describe('export functionality', () => {
    test('should export save data', () => {
      const { result } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      const exportedData = result.current.exportSave();

      expect(MockSaveSystem.exportToString).toHaveBeenCalledWith(
        mockGameState,
        mockParty,
        mockUpgrades
      );
      expect(exportedData).toBe('mock-export-string');
    });
  });

  describe('import functionality', () => {
    test('should import valid save data', () => {
      const { result } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      let success;
      act(() => {
        success = result.current.importSave('valid-save-string');
      });

      expect(MockSaveSystem.importFromString).toHaveBeenCalledWith('valid-save-string');
      expect(success).toBe(true);
      expect(mockSetters.setGameState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetters.setParty).toHaveBeenCalledWith(mockParty);
      expect(mockSetters.setUpgrades).toHaveBeenCalledWith(mockUpgrades);
    });

    test('should reject invalid save data', () => {
      MockSaveSystem.importFromString.mockReturnValue(null);

      const { result } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      let success;
      act(() => {
        success = result.current.importSave('invalid-save-string');
      });

      expect(MockSaveSystem.importFromString).toHaveBeenCalledWith('invalid-save-string');
      expect(success).toBe(false);
    });

    test('should reset combat state on import', () => {
      const { result } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      act(() => {
        result.current.importSave('valid-save-string');
      });

      // Check that setGameState was called with a function that resets combat
      const setGameStateCall = mockSetters.setGameState.mock.calls[0][0];
      const newState = setGameStateCall({ 
        combatLog: [],
        inCombat: true,
        enemies: [{ id: '1', name: 'Test' }]
      });

      expect(newState.inCombat).toBe(false);
      expect(newState.enemies).toEqual([]);
      
      // Check that CombatLogManager.addMessage was called with import message
      expect(MockCombatLogManager.addMessage).toHaveBeenCalledWith({
        text: '📥 Save imported successfully!',
        category: 'status',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('manual save functionality', () => {
    test('should perform manual save', () => {
      const { result } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      act(() => {
        result.current.manualSave();
      });

      expect(MockSaveSystem.manualSave).toHaveBeenCalledWith(
        mockGameState,
        mockParty,
        mockUpgrades
      );
      expect(MockCombatLogManager.addMessage).toHaveBeenCalledWith({
        text: '💾 Game saved manually!',
        category: 'status',
        timestamp: expect.any(Number)
      });
    });

    test('should add save confirmation message', () => {
      const { result } = renderHook(() => useSaveSystem({
        gameState: mockGameState,
        party: mockParty,
        upgrades: mockUpgrades,
        ...mockSetters
      }));

      act(() => {
        result.current.manualSave();
      });

      // Check that CombatLogManager.addMessage was called with the correct message
      expect(MockCombatLogManager.addMessage).toHaveBeenCalledWith({
        text: '💾 Game saved manually!',
        category: 'status',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('hook dependency handling', () => {
    test('should update autosave when game state changes', async () => {
      const { isProd } = await import('../utils/Environment');
      vi.mocked(isProd).mockReturnValue(true);

      const { rerender } = renderHook(
        ({ gameState }) => useSaveSystem({
          gameState,
          party: mockParty,
          upgrades: mockUpgrades,
          ...mockSetters
        }),
        { initialProps: { gameState: mockGameState } }
      );

      expect(MockSaveSystem.startAutoSave).toHaveBeenCalledTimes(1);

      // Update game state
      const newGameState = { ...mockGameState, currentFloor: 5 };
      rerender({ gameState: newGameState });

      // Should call startAutoSave again with new data
      expect(MockSaveSystem.startAutoSave).toHaveBeenCalledTimes(2);
    });
  });
});