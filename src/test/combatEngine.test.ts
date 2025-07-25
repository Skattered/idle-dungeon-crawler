import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectTarget, Enemy, PartyMember } from '../combat/CombatEngine';
import { generateTacticalMessage } from '../combat/CombatMessage';

// Mock data factories
const createEnemy = (id: string, name: string, hp: number, maxHp: number, attack: number, defense: number): Enemy => ({
  id,
  name,
  hp,
  maxHp,
  attack,
  defense
});

const createPartyMember = (name: string, role: string, skillName: string = 'Basic Skill'): PartyMember => ({
  name,
  role,
  skill: {
    name: skillName,
    description: 'A basic skill',
    cooldown: 1000,
    effect: {
      type: 'damage',
      value: 1.5
    }
  }
});

describe('Combat Engine', () => {
  describe('selectTarget', () => {
    let enemies: Enemy[];
    
    beforeEach(() => {
      enemies = [
        createEnemy('1', 'Goblin', 30, 50, 10, 5),     // Low HP, low attack
        createEnemy('2', 'Orc', 80, 100, 20, 8),       // High HP, high attack  
        createEnemy('3', 'Skeleton', 15, 30, 8, 3),    // Very low HP, low attack
        createEnemy('4', 'Troll', 120, 150, 25, 12)    // Very high HP, very high attack
      ];
    });

    describe('when no enemies are alive', () => {
      it('should return null', () => {
        const deadEnemies = enemies.map(e => ({ ...e, hp: 0 }));
        const tank = createPartyMember('Tank', 'tank');
        
        const target = selectTarget(tank, deadEnemies);
        
        expect(target).toBeNull();
      });
    });

    describe('when only one enemy is alive', () => {
      it('should return the single alive enemy', () => {
        const mixedEnemies = [
          { ...enemies[0], hp: 0 },
          enemies[1], // Only this one alive
          { ...enemies[2], hp: 0 },
          { ...enemies[3], hp: 0 }
        ];
        const warrior = createPartyMember('Warrior', 'warrior');
        
        const target = selectTarget(warrior, mixedEnemies);
        
        expect(target).toBe(enemies[1]);
        expect(target?.name).toBe('Orc');
      });
    });

    describe('tank targeting', () => {
      it('should target highest attack enemy', () => {
        const tank = createPartyMember('Guardian', 'tank');
        
        const target = selectTarget(tank, enemies);
        
        expect(target?.name).toBe('Troll'); // Highest attack (25)
        expect(target?.attack).toBe(25);
      });

      it('should handle ties by returning first found', () => {
        const equalAttackEnemies = [
          createEnemy('1', 'Goblin A', 30, 50, 20, 5),
          createEnemy('2', 'Goblin B', 40, 50, 20, 5), // Same attack
          createEnemy('3', 'Weak Enemy', 10, 20, 5, 2)
        ];
        const tank = createPartyMember('Guardian', 'tank');
        
        const target = selectTarget(tank, equalAttackEnemies);
        
        expect(target?.attack).toBe(20);
        expect(['Goblin A', 'Goblin B']).toContain(target?.name);
      });
    });

    describe('healer targeting', () => {
      it('should target lowest HP enemy', () => {
        const healer = createPartyMember('Priest', 'healer');
        
        const target = selectTarget(healer, enemies);
        
        expect(target?.name).toBe('Skeleton'); // Lowest HP (15)
        expect(target?.hp).toBe(15);
      });

      it('should handle multiple enemies with same low HP', () => {
        const equalHpEnemies = [
          createEnemy('1', 'Weak A', 10, 50, 8, 5),
          createEnemy('2', 'Weak B', 10, 40, 9, 4), // Same HP
          createEnemy('3', 'Strong', 100, 100, 15, 8)
        ];
        const healer = createPartyMember('Priest', 'healer');
        
        const target = selectTarget(healer, equalHpEnemies);
        
        expect(target?.hp).toBe(10);
        expect(['Weak A', 'Weak B']).toContain(target?.name);
      });
    });

    describe('warrior targeting', () => {
      it('should target enemy closest to 50% HP', () => {
        const warriorEnemies = [
          createEnemy('1', 'Nearly Full', 90, 100, 10, 5),    // 90% HP
          createEnemy('2', 'Half Health', 50, 100, 15, 6),    // 50% HP (perfect target)
          createEnemy('3', 'Nearly Dead', 10, 100, 8, 3),     // 10% HP
          createEnemy('4', 'Three Quarter', 75, 100, 12, 7)   // 75% HP
        ];
        const warrior = createPartyMember('Knight', 'warrior');
        
        const target = selectTarget(warrior, warriorEnemies);
        
        expect(target?.name).toBe('Half Health');
        expect(target?.hp! / target?.maxHp!).toBe(0.5);
      });

      it('should handle edge case with multiple enemies at same distance from 50%', () => {
        const warriorEnemies = [
          createEnemy('1', 'Above Half', 60, 100, 10, 5),   // 60% HP (10% from 50%)
          createEnemy('2', 'Below Half', 40, 100, 15, 6),   // 40% HP (10% from 50%)
          createEnemy('3', 'Far Above', 90, 100, 8, 3)      // 90% HP (40% from 50%)
        ];
        const warrior = createPartyMember('Knight', 'warrior');
        
        const target = selectTarget(warrior, warriorEnemies);
        
        expect([60, 40]).toContain(target?.hp);
        expect(['Above Half', 'Below Half']).toContain(target?.name);
      });
    });

    describe('rogue targeting', () => {
      it('should target lowest HP enemy for quick elimination', () => {
        const rogue = createPartyMember('Assassin', 'rogue');
        
        const target = selectTarget(rogue, enemies);
        
        expect(target?.name).toBe('Skeleton'); // Lowest HP (15)
        expect(target?.hp).toBe(15);
      });

      it('should prioritize finishing off wounded enemies', () => {
        const rogueEnemies = [
          createEnemy('1', 'Healthy', 100, 100, 10, 5),
          createEnemy('2', 'Wounded', 5, 50, 15, 6),  // Very low HP
          createEnemy('3', 'Damaged', 25, 50, 8, 3)
        ];
        const rogue = createPartyMember('Assassin', 'rogue');
        
        const target = selectTarget(rogue, rogueEnemies);
        
        expect(target?.name).toBe('Wounded');
        expect(target?.hp).toBe(5);
      });
    });

    describe('mage targeting', () => {
      it('should target highest HP enemy to maximize damage value', () => {
        const mage = createPartyMember('Wizard', 'mage');
        
        const target = selectTarget(mage, enemies);
        
        expect(target?.name).toBe('Troll'); // Highest HP (120)
        expect(target?.hp).toBe(120);
      });

      it('should choose between multiple high HP enemies', () => {
        const mageEnemies = [
          createEnemy('1', 'Tank A', 150, 150, 10, 5),
          createEnemy('2', 'Tank B', 160, 160, 15, 6),  // Highest HP
          createEnemy('3', 'Weak', 20, 30, 8, 3)
        ];
        const mage = createPartyMember('Wizard', 'mage');
        
        const target = selectTarget(mage, mageEnemies);
        
        expect(target?.name).toBe('Tank B');
        expect(target?.hp).toBe(160);
      });
    });

    describe('unknown role targeting', () => {
      it('should use random targeting for unknown roles', () => {
        const unknownRole = createPartyMember('Bard', 'bard'); // Unknown role
        
        // Mock Math.random to control randomness
        const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);
        
        const target = selectTarget(unknownRole, enemies);
        
        expect(target).toBeDefined();
        expect(enemies).toContain(target);
        
        mockRandom.mockRestore();
      });

      it('should handle random targeting with different random values', () => {
        const unknownRole = createPartyMember('Bard', 'bard');
        
        // Test with random value that would select first enemy
        const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1);
        
        const target = selectTarget(unknownRole, enemies);
        
        expect(target).toBe(enemies[0]);
        
        mockRandom.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('should handle empty enemy array', () => {
        const warrior = createPartyMember('Knight', 'warrior');
        
        const target = selectTarget(warrior, []);
        
        expect(target).toBeNull();
      });

      it('should handle enemies with zero max HP', () => {
        const brokenEnemies = [
          createEnemy('1', 'Broken', 10, 0, 5, 2) // Zero max HP
        ];
        const warrior = createPartyMember('Knight', 'warrior');
        
        // Should not crash, should handle gracefully
        const target = selectTarget(warrior, brokenEnemies);
        
        expect(target).toBeDefined();
        expect(target?.name).toBe('Broken');
      });

      it('should handle negative HP values', () => {
        const negativeEnemies = [
          createEnemy('1', 'Normal', 20, 50, 10, 5),
          createEnemy('2', 'Negative', -5, 30, 8, 3) // Negative HP (should be filtered out)
        ];
        const healer = createPartyMember('Priest', 'healer');
        
        const target = selectTarget(healer, negativeEnemies);
        
        expect(target?.name).toBe('Normal'); // Should ignore negative HP enemy
        expect(target?.hp).toBeGreaterThan(0);
      });
    });
  });

  describe('generateTacticalMessage', () => {
    let basicEnemy: Enemy;
    let strongEnemy: Enemy;
    let weakEnemy: Enemy;

    beforeEach(() => {
      basicEnemy = createEnemy('1', 'Goblin', 50, 100, 10, 5);
      strongEnemy = createEnemy('2', 'Dragon', 140, 200, 25, 15); // High attack, high HP
      weakEnemy = createEnemy('3', 'Rat', 5, 20, 3, 1); // Low HP, low attack
    });

    describe('tank messages', () => {
      it('should use "focuses on dangerous" for high attack enemies', () => {
        const tank = createPartyMember('Guardian', 'tank', 'Shield Slam');
        
        const message = generateTacticalMessage(tank, strongEnemy, 15, false, 1);
        
        expect(message).toContain('focuses on dangerous');
        expect(message).toContain('Guardian focuses on dangerous Dragon for 15 damage!');
      });

      it('should use "engages" for low attack enemies', () => {
        const tank = createPartyMember('Guardian', 'tank', 'Shield Slam');
        
        const message = generateTacticalMessage(tank, basicEnemy, 12, false, 1);
        
        expect(message).toContain('engages');
        expect(message).toContain('Guardian engages Goblin for 12 damage!');
      });
    });

    describe('healer messages', () => {
      it('should use "finishes off wounded" for low HP enemies', () => {
        const healer = createPartyMember('Priest', 'healer', 'Heal');
        
        const message = generateTacticalMessage(healer, weakEnemy, 8, false, 1);
        
        expect(message).toContain('finishes off wounded');
        expect(message).toContain('Priest finishes off wounded Rat for 8 damage!');
      });

      it('should use "targets" for healthy enemies', () => {
        const healer = createPartyMember('Priest', 'healer', 'Heal');
        
        const message = generateTacticalMessage(healer, basicEnemy, 6, false, 1);
        
        expect(message).toContain('targets');
        expect(message).toContain('Priest targets Goblin for 6 damage!');
      });
    });

    describe('warrior messages', () => {
      it('should use "strikes at" for all enemies', () => {
        const warrior = createPartyMember('Knight', 'warrior', 'Power Strike');
        
        const message = generateTacticalMessage(warrior, basicEnemy, 20, false, 1);
        
        expect(message).toContain('strikes at');
        expect(message).toContain('Knight strikes at Goblin for 20 damage!');
      });
    });

    describe('rogue messages', () => {
      it('should use "assassinates wounded" for low HP enemies', () => {
        const rogue = createPartyMember('Assassin', 'rogue', 'Backstab');
        
        const message = generateTacticalMessage(rogue, weakEnemy, 25, false, 1);
        
        expect(message).toContain('assassinates wounded');
        expect(message).toContain('Assassin assassinates wounded Rat for 25 damage!');
      });

      it('should use "strikes" for healthy enemies', () => {
        const rogue = createPartyMember('Assassin', 'rogue', 'Backstab');
        
        const message = generateTacticalMessage(rogue, basicEnemy, 18, false, 1);
        
        expect(message).toContain('strikes');
        expect(message).toContain('Assassin strikes Goblin for 18 damage!');
      });
    });

    describe('mage messages', () => {
      it('should use "unleashes magic at sturdy" for high HP enemies', () => {
        const mage = createPartyMember('Wizard', 'mage', 'Fireball');
        
        const message = generateTacticalMessage(mage, strongEnemy, 30, false, 1);
        
        expect(message).toContain('unleashes magic at sturdy');
        expect(message).toContain('Wizard unleashes magic at sturdy Dragon for 30 damage!');
      });

      it('should use "casts spell at" for low HP enemies', () => {
        const mage = createPartyMember('Wizard', 'mage', 'Fireball');
        
        const message = generateTacticalMessage(mage, weakEnemy, 15, false, 1);
        
        expect(message).toContain('casts spell at');
        expect(message).toContain('Wizard casts spell at Rat for 15 damage!');
      });
    });

    describe('unknown role messages', () => {
      it('should use "attacks" for unknown roles', () => {
        const unknown = createPartyMember('Bard', 'bard', 'Song');
        
        const message = generateTacticalMessage(unknown, basicEnemy, 10, false, 1);
        
        expect(message).toContain('attacks');
        expect(message).toContain('Bard attacks Goblin for 10 damage!');
      });
    });

    describe('critical hit messages', () => {
      it('should include critical hit indicator', () => {
        const warrior = createPartyMember('Knight', 'warrior', 'Power Strike');
        
        const message = generateTacticalMessage(warrior, basicEnemy, 35, true, 1);
        
        expect(message).toContain('💥 CRITICAL!');
        expect(message).toContain('Knight strikes at Goblin for 35 damage! 💥 CRITICAL!');
      });

      it('should not include critical indicator for normal hits', () => {
        const warrior = createPartyMember('Knight', 'warrior', 'Power Strike');
        
        const message = generateTacticalMessage(warrior, basicEnemy, 20, false, 1);
        
        expect(message).not.toContain('💥 CRITICAL!');
        expect(message).toContain('Knight strikes at Goblin for 20 damage!');
      });
    });

    describe('skill boost messages', () => {
      it('should include skill name when skill boost is active', () => {
        const warrior = createPartyMember('Knight', 'warrior', 'Power Strike');
        
        const message = generateTacticalMessage(warrior, basicEnemy, 30, false, 1.5);
        
        expect(message).toContain('(Power Strike)');
        expect(message).toContain('Knight strikes at Goblin for 30 damage! (Power Strike)');
      });

      it('should not include skill name when no skill boost', () => {
        const warrior = createPartyMember('Knight', 'warrior', 'Power Strike');
        
        const message = generateTacticalMessage(warrior, basicEnemy, 20, false, 1);
        
        expect(message).not.toContain('(Power Strike)');
        expect(message).toContain('Knight strikes at Goblin for 20 damage!');
      });
    });

    describe('combined modifiers', () => {
      it('should handle critical hit and skill boost together', () => {
        const rogue = createPartyMember('Assassin', 'rogue', 'Backstab');
        
        const message = generateTacticalMessage(rogue, weakEnemy, 50, true, 2.0);
        
        expect(message).toContain('💥 CRITICAL!');
        expect(message).toContain('(Backstab)');
        expect(message).toContain('Assassin assassinates wounded Rat for 50 damage! 💥 CRITICAL! (Backstab)');
      });

      it('should handle all modifiers with contextual targeting', () => {
        const tank = createPartyMember('Guardian', 'tank', 'Shield Slam');
        
        const message = generateTacticalMessage(tank, strongEnemy, 45, true, 1.8);
        
        expect(message).toContain('focuses on dangerous');
        expect(message).toContain('💥 CRITICAL!');
        expect(message).toContain('(Shield Slam)');
        expect(message).toBe('Guardian focuses on dangerous Dragon for 45 damage! 💥 CRITICAL! (Shield Slam)');
      });
    });
  });
});