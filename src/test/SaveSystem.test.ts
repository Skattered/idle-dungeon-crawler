import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../utils/SaveSystem';

// Mock Environment module
vi.mock('../utils/Environment', () => ({
  isProd: vi.fn(() => false) // Default to development
}));

describe('SaveSystem', () => {
  const mockSaveData = {
    gameState: {
      currentFloor: 5,
      maxFloorReached: 5,
      currentGroup: 2,
      totalGroupsPerFloor: 4,
      gold: 1500,
      totalGoldEarned: 3000,
      totalRuns: 3,
      gearsFound: 12,
      monstersKilled: 45,
      runHistory: [
        { runNumber: 1, floorReached: 3, timestamp: 1642000000000 },
        { runNumber: 2, floorReached: 4, timestamp: 1642001000000 }
      ]
    },
    party: [
      {
        name: 'Tank',
        class: 'tank',
        role: 'tank',
        level: 5,
        experience: 150,
        hp: 200,
        maxHp: 200,
        baseHp: 200,
        baseAttack: 25,
        baseDefense: 35,
        attack: 25,
        defense: 35,
        attackSpeed: 1.0,
        isProtected: false,
        attackTimer: 0,
        gear: {
          weapon: { level: 3 },
          helm: { level: 2 },
          chest: { level: 1 },
          ring1: { level: 0 },
          ring2: { level: 0 },
          amulet: { level: 0 },
          gloves: { level: 0 },
          bracers: { level: 0 },
          boots: { level: 0 },
          pants: { level: 0 }
        }
      },
      {
        name: 'DPS',
        class: 'dps',
        role: 'dps',
        level: 4,
        experience: 120,
        hp: 150,
        maxHp: 150,
        baseHp: 150,
        baseAttack: 45,
        baseDefense: 15,
        attack: 45,
        defense: 15,
        attackSpeed: 1.0,
        isProtected: false,
        attackTimer: 0,
        gear: {
          weapon: { level: 4 },
          helm: { level: 1 },
          chest: { level: 0 },
          ring1: { level: 0 },
          ring2: { level: 0 },
          amulet: { level: 0 },
          gloves: { level: 0 },
          bracers: { level: 0 },
          boots: { level: 0 },
          pants: { level: 0 }
        }
      }
    ],
    upgrades: {
      attackBonus: 3,
      defenseBonus: 2,
      healthBonus: 1,
      goldMultiplier: 4,
      gearDropBonus: 2
    },
    timestamp: Date.now(),
    version: '0.1.1'
  };

  beforeEach(() => {
    // Clear localStorage and cookies before each test
    localStorage.clear();
    document.cookie = 'dungeon-crawler-save=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  describe('encoding and decoding', () => {
    test('should encode and decode strings correctly', () => {
      const testString = 'Hello, World! 123 @#$%';
      const encoded = SaveSystem.encodeString(testString);
      const decoded = SaveSystem.decodeString(encoded);
      
      expect(decoded).toBe(testString);
      expect(encoded).not.toBe(testString);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('should encode empty string', () => {
      const encoded = SaveSystem.encodeString('');
      const decoded = SaveSystem.decodeString(encoded);
      
      expect(decoded).toBe('');
    });

    test('should handle unicode characters', () => {
      const testString = '🎮🏰⚔️🛡️💰';
      const encoded = SaveSystem.encodeString(testString);
      const decoded = SaveSystem.decodeString(encoded);
      
      expect(decoded).toBe(testString);
    });
  });

  describe('save data compression', () => {
    test('should compress save data with short keys', () => {
      const compressed = SaveSystem.compressSaveData(mockSaveData);
      
      expect(compressed).toHaveProperty('g'); // gameState
      expect(compressed).toHaveProperty('p'); // party
      expect(compressed).toHaveProperty('u'); // upgrades
      expect(compressed).toHaveProperty('t'); // timestamp
      expect(compressed).toHaveProperty('v'); // version
      
      expect(compressed.g).toHaveProperty('f', 5); // currentFloor
      expect(compressed.g).toHaveProperty('mf', 5); // maxFloorReached
      expect(compressed.g).toHaveProperty('go', 1500); // gold
      expect(compressed.u).toHaveProperty('a', 3); // attackBonus
    });

    test('should decompress save data correctly', () => {
      const compressed = SaveSystem.compressSaveData(mockSaveData);
      const decompressed = SaveSystem.decompressSaveData(compressed);
      
      expect(decompressed.gameState.currentFloor).toBe(mockSaveData.gameState.currentFloor);
      expect(decompressed.gameState.gold).toBe(mockSaveData.gameState.gold);
      expect(decompressed.upgrades.attackBonus).toBe(mockSaveData.upgrades.attackBonus);
      expect(decompressed.party[0].name).toBe(mockSaveData.party[0].name);
      expect(decompressed.party[0].gear.weapon.level).toBe(3);
    });
  });

  describe('export and import', () => {
    test('should export to encoded string', () => {
      const exported = SaveSystem.exportToString(
        mockSaveData.gameState,
        mockSaveData.party,
        mockSaveData.upgrades
      );
      
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
      // Should be encoded (not readable JSON)
      expect(() => JSON.parse(exported)).toThrow();
    });

    test('should import from encoded string', () => {
      const exported = SaveSystem.exportToString(
        mockSaveData.gameState,
        mockSaveData.party,
        mockSaveData.upgrades
      );
      
      const imported = SaveSystem.importFromString(exported);
      
      expect(imported).not.toBeNull();
      expect(imported!.gameState.currentFloor).toBe(mockSaveData.gameState.currentFloor);
      expect(imported!.gameState.gold).toBe(mockSaveData.gameState.gold);
      expect(imported!.party[0].name).toBe(mockSaveData.party[0].name);
    });

    test('should return null for invalid import data', () => {
      const result = SaveSystem.importFromString('invalid-data');
      expect(result).toBeNull();
    });

    test('should return null for malformed encoded data', () => {
      const result = SaveSystem.importFromString('QWxhZGRpbjpvcGVuIHNlc2FtZQ=='); // Valid base64 but wrong format
      expect(result).toBeNull();
    });
  });

  describe('localStorage operations', () => {
    test('should save to and load from localStorage', () => {
      SaveSystem.saveToLocalStorage(mockSaveData);
      const loaded = SaveSystem.loadFromLocalStorage();
      
      expect(loaded).not.toBeNull();
      expect(loaded!.gameState.currentFloor).toBe(mockSaveData.gameState.currentFloor);
      expect(loaded!.gameState.gold).toBe(mockSaveData.gameState.gold);
    });

    test('should return null when localStorage is empty', () => {
      const loaded = SaveSystem.loadFromLocalStorage();
      expect(loaded).toBeNull();
    });
  });

  describe('cookie operations', () => {
    test('should save to and load from cookies', () => {
      SaveSystem.saveToCookies(mockSaveData);
      const loaded = SaveSystem.loadFromCookies();
      
      expect(loaded).not.toBeNull();
      expect(loaded!.gameState.currentFloor).toBe(mockSaveData.gameState.currentFloor);
      expect(loaded!.gameState.gold).toBe(mockSaveData.gameState.gold);
    });

    test('should return null when no cookie exists', () => {
      const loaded = SaveSystem.loadFromCookies();
      expect(loaded).toBeNull();
    });
  });

  describe('manual save', () => {
    test('should save in development mode', () => {
      // Manual save should now work in development
      SaveSystem.manualSave(
        mockSaveData.gameState,
        mockSaveData.party,
        mockSaveData.upgrades
      );
      
      const fromLocalStorage = SaveSystem.loadFromLocalStorage();
      const fromCookies = SaveSystem.loadFromCookies();
      
      // Should save successfully in development mode
      expect(fromLocalStorage).not.toBeNull();
      expect(fromCookies).not.toBeNull();
      expect(fromLocalStorage?.gameState.gold).toBe(mockSaveData.gameState.gold);
    });
  });

  describe('loadGame priority', () => {
    test('should prioritize localStorage over cookies', () => {
      const localStorageData = { ...mockSaveData, gameState: { ...mockSaveData.gameState, currentFloor: 10 }};
      const cookieData = { ...mockSaveData, gameState: { ...mockSaveData.gameState, currentFloor: 5 }};
      
      SaveSystem.saveToLocalStorage(localStorageData);
      SaveSystem.saveToCookies(cookieData);
      
      const loaded = SaveSystem.loadGame();
      expect(loaded!.gameState.currentFloor).toBe(10); // Should get localStorage value
    });

    test('should fall back to cookies when localStorage is empty', () => {
      SaveSystem.saveToCookies(mockSaveData);
      
      const loaded = SaveSystem.loadGame();
      expect(loaded!.gameState.currentFloor).toBe(mockSaveData.gameState.currentFloor);
    });
  });
});