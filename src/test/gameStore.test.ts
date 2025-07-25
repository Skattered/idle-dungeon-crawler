import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { Enemy, LogMessage } from '../store/types';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      game: {
        currentFloor: 1,
        maxFloorReached: 1,
        currentGroup: 1,
        totalGroupsPerFloor: 5,
        gameSpeed: 1000,
        isLoading: false,
        lastSaveTime: 0,
      },
      combat: {
        inCombat: false,
        enemies: [],
        combatLog: [],
        shieldWallActive: false,
        shieldWallTurns: 0,
        performingMassRes: false,
        massResurrectionTimer: 0,
        healerProtected: false,
        enemyAttackTimer: 0,
      },
      economy: {
        gold: 0,
        totalGoldEarned: 0,
        upgrades: {
          attackBonus: 0,
          defenseBonus: 0,
          healthBonus: 0,
          goldMultiplier: 1,
          gearDropBonus: 0,
        },
      },
      party: {
        members: [],
        formation: {},
      },
      progression: {
        totalRuns: 0,
        monstersKilled: 0,
        gearsFound: 0,
        runHistory: [],
      },
    });
  });

  describe('Combat Actions', () => {
    it('should start combat correctly', () => {
      const store = useGameStore.getState();
      const enemies: Enemy[] = [
        { id: '1', name: 'Goblin', hp: 100, maxHp: 100, attack: 10, defense: 5 }
      ];

      store.actions.startCombat(enemies);

      const state = useGameStore.getState();
      expect(state.combat.inCombat).toBe(true);
      expect(state.combat.enemies).toEqual(enemies);
    });

    it('should end combat correctly', () => {
      const store = useGameStore.getState();
      
      // First start combat
      store.actions.startCombat([{ id: '1', name: 'Goblin', hp: 100, maxHp: 100, attack: 10, defense: 5 }]);
      
      // Then end it
      store.actions.endCombat();

      const state = useGameStore.getState();
      expect(state.combat.inCombat).toBe(false);
      expect(state.combat.enemies).toEqual([]);
    });

    it('should update combat log correctly', () => {
      const store = useGameStore.getState();
      const message: LogMessage = {
        text: 'Test message',
        category: 'combat',
        timestamp: Date.now(),
      };

      store.actions.updateCombatLog(message);

      const state = useGameStore.getState();
      expect(state.combat.combatLog).toHaveLength(1);
      expect(state.combat.combatLog[0]).toEqual(message);
    });
  });

  describe('Economy Actions', () => {
    it('should earn gold correctly', () => {
      const store = useGameStore.getState();
      
      store.actions.earnGold(100);

      const state = useGameStore.getState();
      expect(state.economy.gold).toBe(100);
      expect(state.economy.totalGoldEarned).toBe(100);
    });

    it('should spend gold when available', () => {
      const store = useGameStore.getState();
      
      // First earn some gold
      store.actions.earnGold(200);
      
      // Then spend it
      const success = store.actions.spendGold(100);

      expect(success).toBe(true);
      const state = useGameStore.getState();
      expect(state.economy.gold).toBe(100);
    });

    it('should not spend gold when insufficient', () => {
      const store = useGameStore.getState();
      
      const success = store.actions.spendGold(100);

      expect(success).toBe(false);
      const state = useGameStore.getState();
      expect(state.economy.gold).toBe(0);
    });
  });

  describe('Game Actions', () => {
    it('should advance floor correctly', () => {
      const store = useGameStore.getState();
      
      store.actions.advanceFloor();

      const state = useGameStore.getState();
      expect(state.game.currentFloor).toBe(2);
      expect(state.game.maxFloorReached).toBe(2);
      expect(state.game.currentGroup).toBe(1); // Should reset to 1
    });

    it('should advance group correctly', () => {
      const store = useGameStore.getState();
      
      store.actions.advanceGroup();

      const state = useGameStore.getState();
      expect(state.game.currentGroup).toBe(2);
      expect(state.game.currentFloor).toBe(1); // Should stay the same
    });

    it('should set game speed correctly', () => {
      const store = useGameStore.getState();
      
      store.actions.setGameSpeed(500);

      const state = useGameStore.getState();
      expect(state.game.gameSpeed).toBe(500);
    });
  });

  describe('Party Actions', () => {
    it('should update party member correctly', () => {
      const store = useGameStore.getState();
      
      // First add a party member
      store.actions.setPartyState({
        members: [{
          name: 'Test Warrior',
          class: 'warrior',
          role: 'tank',
          level: 1,
          experience: 0,
          hp: 100,
          maxHp: 100,
          baseHp: 100,
          attack: 20,
          defense: 15,
          baseAttack: 20,
          baseDefense: 15,
          attackTimer: 0,
          attackSpeed: 1,
          isProtected: false,
          skillCooldown: 0,
          skillActive: false,
          skill: { effect: { type: 'damage', value: 1 }, cooldown: 1000 },
          gear: {
            weapon: { level: 0 },
            helm: { level: 0 },
            chest: { level: 0 },
            ring1: { level: 0 },
            ring2: { level: 0 },
            amulet: { level: 0 },
            gloves: { level: 0 },
            bracers: { level: 0 },
            boots: { level: 0 },
            pants: { level: 0 },
          },
        }],
      });
      
      // Then update the member
      store.actions.updatePartyMember(0, { hp: 50 });

      const state = useGameStore.getState();
      expect(state.party.members[0].hp).toBe(50);
      expect(state.party.members[0].maxHp).toBe(100); // Should remain unchanged
    });

    it('should heal party member correctly', () => {
      const store = useGameStore.getState();
      
      // First add a party member with reduced HP
      store.actions.setPartyState({
        members: [{
          name: 'Test Warrior',
          class: 'warrior',
          role: 'tank',
          level: 1,
          experience: 0,
          hp: 50,
          maxHp: 100,
          baseHp: 100,
          attack: 20,
          defense: 15,
          baseAttack: 20,
          baseDefense: 15,
          attackTimer: 0,
          attackSpeed: 1,
          isProtected: false,
          skillCooldown: 0,
          skillActive: false,
          skill: { effect: { type: 'damage', value: 1 }, cooldown: 1000 },
          gear: {
            weapon: { level: 0 },
            helm: { level: 0 },
            chest: { level: 0 },
            ring1: { level: 0 },
            ring2: { level: 0 },
            amulet: { level: 0 },
            gloves: { level: 0 },
            bracers: { level: 0 },
            boots: { level: 0 },
            pants: { level: 0 },
          },
        }],
      });
      
      // Then heal the member
      store.actions.healPartyMember(0, 30);

      const state = useGameStore.getState();
      expect(state.party.members[0].hp).toBe(80);
    });

    it('should not heal above maxHp', () => {
      const store = useGameStore.getState();
      
      // Add a party member with reduced HP
      store.actions.setPartyState({
        members: [{
          name: 'Test Warrior',
          class: 'warrior',
          role: 'tank',
          level: 1,
          experience: 0,
          hp: 90,
          maxHp: 100,
          baseHp: 100,
          attack: 20,
          defense: 15,
          baseAttack: 20,
          baseDefense: 15,
          attackTimer: 0,
          attackSpeed: 1,
          isProtected: false,
          skillCooldown: 0,
          skillActive: false,
          skill: { effect: { type: 'damage', value: 1 }, cooldown: 1000 },
          gear: {
            weapon: { level: 0 },
            helm: { level: 0 },
            chest: { level: 0 },
            ring1: { level: 0 },
            ring2: { level: 0 },
            amulet: { level: 0 },
            gloves: { level: 0 },
            bracers: { level: 0 },
            boots: { level: 0 },
            pants: { level: 0 },
          },
        }],
      });
      
      // Try to heal beyond maxHp
      store.actions.healPartyMember(0, 50);

      const state = useGameStore.getState();
      expect(state.party.members[0].hp).toBe(100); // Should cap at maxHp
    });
  });

  describe('Progression Actions', () => {
    it('should increment monsters killed', () => {
      const store = useGameStore.getState();
      
      store.actions.incrementMonstersKilled(5);

      const state = useGameStore.getState();
      expect(state.progression.monstersKilled).toBe(5);
    });

    it('should increment gears found', () => {
      const store = useGameStore.getState();
      
      store.actions.incrementGearsFound(2);

      const state = useGameStore.getState();
      expect(state.progression.gearsFound).toBe(2);
    });

    it('should add run to history', () => {
      const store = useGameStore.getState();
      const run = {
        runNumber: 1,
        floorReached: 5,
        timestamp: Date.now(),
      };
      
      store.actions.addRunToHistory(run);

      const state = useGameStore.getState();
      expect(state.progression.runHistory).toHaveLength(1);
      expect(state.progression.runHistory[0]).toEqual(run);
    });
  });
});