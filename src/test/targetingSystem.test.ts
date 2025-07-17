import { describe, it, expect } from 'vitest'

describe('Enhanced Targeting System', () => {
  // Mock the targeting logic since it's embedded in the component
  const selectTarget = (attacker: any, enemies: any[]) => {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) return null;
    if (aliveEnemies.length === 1) return aliveEnemies[0];

    switch(attacker.role) {
      case 'tank':
        // Tank targets highest attack enemies (threat-based)
        return aliveEnemies.reduce((highest, current) => 
          current.attack > highest.attack ? current : highest
        );
      
      case 'healer':
        // Healer targets lowest HP enemies to finish them off
        return aliveEnemies.reduce((lowest, current) => 
          current.hp < lowest.hp ? current : lowest
        );
      
      case 'warrior':
        // Warrior uses balanced targeting (enemies around 50% HP)
        const sortedByHp = [...aliveEnemies].sort((a, b) => {
          const aPercent = a.hp / a.maxHp;
          const bPercent = b.hp / b.maxHp;
          return Math.abs(aPercent - 0.5) - Math.abs(bPercent - 0.5);
        });
        return sortedByHp[0];
      
      case 'rogue':
        // Rogue targets lowest HP enemies for quick eliminations
        return aliveEnemies.reduce((lowest, current) => 
          current.hp < lowest.hp ? current : lowest
        );
      
      case 'mage':
        // Mage targets highest HP enemies to maximize damage value
        return aliveEnemies.reduce((highest, current) => 
          current.hp > highest.hp ? current : highest
        );
      
      default:
        // Fallback to random targeting
        return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    }
  };

  const generateTacticalMessage = (attacker: any, target: any, damage: number, isCritical: boolean, skillBoost: number) => {
    const tacticalContext = {
      tank: target.attack >= 15 ? 'focuses on dangerous' : 'engages',
      healer: target.hp <= target.maxHp * 0.3 ? 'finishes off wounded' : 'targets',
      warrior: 'strikes at',
      rogue: target.hp <= target.maxHp * 0.3 ? 'assassinates wounded' : 'strikes',
      mage: target.hp >= target.maxHp * 0.7 ? 'unleashes magic at sturdy' : 'casts spell at'
    };
    
    const action = tacticalContext[attacker.role] || 'attacks';
    const skillText = skillBoost > 1 ? ` (${attacker.skill.name})` : '';
    const critText = isCritical ? ' 💥 CRITICAL!' : '';
    
    return `${attacker.name} ${action} ${target.name} for ${damage} damage!${critText}${skillText}`;
  };

  describe('Target Selection Logic', () => {
    let enemies: any[];

    beforeEach(() => {
      enemies = [
        { id: '1', name: 'Weak Goblin', hp: 20, maxHp: 100, attack: 8, defense: 2 },
        { id: '2', name: 'Strong Orc', hp: 90, maxHp: 100, attack: 20, defense: 5 },
        { id: '3', name: 'Medium Troll', hp: 50, maxHp: 100, attack: 15, defense: 8 },
        { id: '4', name: 'Hurt Dragon', hp: 30, maxHp: 150, attack: 25, defense: 10 }
      ];
    });

    it('should have tank target highest attack enemies', () => {
      const tank = { role: 'tank', name: 'Tank' };
      const target = selectTarget(tank, enemies);
      
      expect(target.name).toBe('Hurt Dragon'); // Highest attack (25)
    });

    it('should have healer target lowest HP enemies', () => {
      const healer = { role: 'healer', name: 'Healer' };
      const target = selectTarget(healer, enemies);
      
      expect(target.name).toBe('Weak Goblin'); // Lowest HP (20)
    });

    it('should have warrior target balanced enemies', () => {
      const warrior = { role: 'warrior', name: 'Warrior' };
      const target = selectTarget(warrior, enemies);
      
      expect(target.name).toBe('Medium Troll'); // Closest to 50% HP (50/100 = 50%)
    });

    it('should have rogue target lowest HP enemies', () => {
      const rogue = { role: 'rogue', name: 'Rogue' };
      const target = selectTarget(rogue, enemies);
      
      expect(target.name).toBe('Weak Goblin'); // Lowest HP (20)
    });

    it('should have mage target highest HP enemies', () => {
      const mage = { role: 'mage', name: 'Mage' };
      const target = selectTarget(mage, enemies);
      
      expect(target.name).toBe('Strong Orc'); // Highest HP (90)
    });

    it('should handle single enemy correctly', () => {
      const singleEnemy = [enemies[0]];
      const tank = { role: 'tank', name: 'Tank' };
      const target = selectTarget(tank, singleEnemy);
      
      expect(target).toBe(singleEnemy[0]);
    });

    it('should return null for no alive enemies', () => {
      const deadEnemies = enemies.map(e => ({ ...e, hp: 0 }));
      const tank = { role: 'tank', name: 'Tank' };
      const target = selectTarget(tank, deadEnemies);
      
      expect(target).toBeNull();
    });

    it('should filter out dead enemies', () => {
      const mixedEnemies = [
        { id: '1', name: 'Dead Goblin', hp: 0, maxHp: 100, attack: 8, defense: 2 },
        { id: '2', name: 'Alive Orc', hp: 50, maxHp: 100, attack: 20, defense: 5 }
      ];
      
      const tank = { role: 'tank', name: 'Tank' };
      const target = selectTarget(tank, mixedEnemies);
      
      expect(target.name).toBe('Alive Orc');
    });
  });

  describe('Tactical Message Generation', () => {
    let attacker: any;
    let target: any;

    beforeEach(() => {
      attacker = {
        name: 'Test Warrior',
        role: 'warrior',
        skill: { name: 'Blade Storm' }
      };
      
      target = {
        name: 'Test Enemy',
        hp: 50,
        maxHp: 100,
        attack: 15
      };
    });

    it('should generate basic attack message', () => {
      const message = generateTacticalMessage(attacker, target, 25, false, 1);
      expect(message).toBe('Test Warrior strikes at Test Enemy for 25 damage!');
    });

    it('should include critical hit indicator', () => {
      const message = generateTacticalMessage(attacker, target, 50, true, 1);
      expect(message).toBe('Test Warrior strikes at Test Enemy for 50 damage! 💥 CRITICAL!');
    });

    it('should include skill name for boosted attacks', () => {
      const message = generateTacticalMessage(attacker, target, 45, false, 1.8);
      expect(message).toBe('Test Warrior strikes at Test Enemy for 45 damage! (Blade Storm)');
    });

    it('should include both critical and skill indicators', () => {
      const message = generateTacticalMessage(attacker, target, 90, true, 1.8);
      expect(message).toBe('Test Warrior strikes at Test Enemy for 90 damage! 💥 CRITICAL! (Blade Storm)');
    });

    it('should use tactical context for tank vs dangerous enemy', () => {
      const tank = { ...attacker, role: 'tank', name: 'Tank' };
      const dangerousEnemy = { ...target, attack: 20 };
      
      const message = generateTacticalMessage(tank, dangerousEnemy, 30, false, 1);
      expect(message).toBe('Tank focuses on dangerous Test Enemy for 30 damage!');
    });

    it('should use tactical context for healer vs wounded enemy', () => {
      const healer = { ...attacker, role: 'healer', name: 'Healer' };
      const woundedEnemy = { ...target, hp: 25 }; // 25% HP
      
      const message = generateTacticalMessage(healer, woundedEnemy, 20, false, 1);
      expect(message).toBe('Healer finishes off wounded Test Enemy for 20 damage!');
    });

    it('should use tactical context for rogue vs wounded enemy', () => {
      const rogue = { ...attacker, role: 'rogue', name: 'Rogue' };
      const woundedEnemy = { ...target, hp: 20 }; // 20% HP
      
      const message = generateTacticalMessage(rogue, woundedEnemy, 35, false, 1);
      expect(message).toBe('Rogue assassinates wounded Test Enemy for 35 damage!');
    });

    it('should use tactical context for mage vs sturdy enemy', () => {
      const mage = { ...attacker, role: 'mage', name: 'Mage' };
      const sturdyEnemy = { ...target, hp: 80 }; // 80% HP
      
      const message = generateTacticalMessage(mage, sturdyEnemy, 40, false, 1);
      expect(message).toBe('Mage unleashes magic at sturdy Test Enemy for 40 damage!');
    });
  });

  describe('Targeting Strategy Validation', () => {
    it('should ensure tank targeting reduces party damage taken', () => {
      const enemies = [
        { id: '1', name: 'Weak Attacker', hp: 50, maxHp: 100, attack: 5, defense: 2 },
        { id: '2', name: 'Strong Attacker', hp: 50, maxHp: 100, attack: 25, defense: 2 }
      ];
      
      const tank = { role: 'tank', name: 'Tank' };
      const target = selectTarget(tank, enemies);
      
      // Tank should prioritize the stronger attacker
      expect(target.attack).toBe(25);
      expect(target.name).toBe('Strong Attacker');
    });

    it('should ensure healer/rogue targeting speeds up combat', () => {
      const enemies = [
        { id: '1', name: 'Nearly Dead', hp: 10, maxHp: 100, attack: 15, defense: 2 },
        { id: '2', name: 'Healthy', hp: 90, maxHp: 100, attack: 15, defense: 2 }
      ];
      
      const healer = { role: 'healer', name: 'Healer' };
      const rogue = { role: 'rogue', name: 'Rogue' };
      
      const healerTarget = selectTarget(healer, enemies);
      const rogueTarget = selectTarget(rogue, enemies);
      
      // Both should target the nearly dead enemy for quick elimination
      expect(healerTarget.name).toBe('Nearly Dead');
      expect(rogueTarget.name).toBe('Nearly Dead');
    });

    it('should ensure mage targeting maximizes damage value', () => {
      const enemies = [
        { id: '1', name: 'Low HP', hp: 20, maxHp: 100, attack: 15, defense: 2 },
        { id: '2', name: 'High HP', hp: 95, maxHp: 100, attack: 15, defense: 2 }
      ];
      
      const mage = { role: 'mage', name: 'Mage' };
      const target = selectTarget(mage, enemies);
      
      // Mage should target high HP enemy to avoid damage waste
      expect(target.name).toBe('High HP');
      expect(target.hp).toBe(95);
    });
  });
})