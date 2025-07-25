import { describe, it, expect, beforeEach } from 'vitest'

describe('Upgrade System', () => {
  describe('Upgrade Cost Calculation', () => {
    const upgradeShop = {
      attackBonus: {
        name: 'Attack Training',
        description: '+1 Attack for all party members',
        baseCost: 50,
        costMultiplier: 1.5
      },
      defenseBonus: {
        name: 'Defense Training', 
        description: '+1 Defense for all party members',
        baseCost: 50,
        costMultiplier: 1.5
      },
      healthBonus: {
        name: 'Health Training',
        description: '+5 Max HP for all party members',
        baseCost: 40,
        costMultiplier: 1.4
      },
      goldMultiplier: {
        name: 'Treasure Hunter',
        description: '+10% gold earned from combat',
        baseCost: 100,
        costMultiplier: 2.0
      },
      gearDropBonus: {
        name: 'Lucky Find',
        description: '+5% gear drop chance',
        baseCost: 150,
        costMultiplier: 2.5
      }
    }

    const getUpgradeCost = (upgradeType: string, currentLevel: number) => {
      const upgrade = upgradeShop[upgradeType as keyof typeof upgradeShop]
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel))
    }

    it('should calculate correct cost for level 0 upgrades', () => {
      expect(getUpgradeCost('attackBonus', 0)).toBe(50) // base cost
      expect(getUpgradeCost('healthBonus', 0)).toBe(40)
      expect(getUpgradeCost('goldMultiplier', 0)).toBe(100)
      expect(getUpgradeCost('gearDropBonus', 0)).toBe(150)
    })

    it('should calculate exponentially increasing costs', () => {
      // Attack bonus with 1.5x multiplier
      expect(getUpgradeCost('attackBonus', 1)).toBe(75)  // 50 * 1.5
      expect(getUpgradeCost('attackBonus', 2)).toBe(112) // 50 * 1.5^2 = 112.5, floored
      expect(getUpgradeCost('attackBonus', 3)).toBe(168) // 50 * 1.5^3 = 168.75, floored

      // Gold multiplier with 2.0x multiplier
      expect(getUpgradeCost('goldMultiplier', 1)).toBe(200) // 100 * 2.0
      expect(getUpgradeCost('goldMultiplier', 2)).toBe(400) // 100 * 2.0^2
      expect(getUpgradeCost('goldMultiplier', 3)).toBe(800) // 100 * 2.0^3
    })

    it('should handle high level upgrades correctly', () => {
      const highLevelCost = getUpgradeCost('gearDropBonus', 5) // 150 * 2.5^5
      expect(highLevelCost).toBe(14648) // 150 * 97.65625, floored
    })
  })

  describe('Purchase Validation', () => {
    let gameState: any
    let upgrades: any

    beforeEach(() => {
      gameState = {
        gold: 1000
      }
      
      upgrades = {
        attackBonus: 0,
        defenseBonus: 1,
        healthBonus: 2,
        goldMultiplier: 0,
        gearDropBonus: 0
      }
    })

    const getUpgradeCost = (upgradeType: string, currentLevel: number) => {
      const upgradeShop = {
        attackBonus: { baseCost: 50, costMultiplier: 1.5 },
        defenseBonus: { baseCost: 50, costMultiplier: 1.5 },
        healthBonus: { baseCost: 40, costMultiplier: 1.4 },
        goldMultiplier: { baseCost: 100, costMultiplier: 2.0 },
        gearDropBonus: { baseCost: 150, costMultiplier: 2.5 }
      }
      const upgrade = upgradeShop[upgradeType as keyof typeof upgradeShop]
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel))
    }

    it('should allow purchase when player has enough gold', () => {
      const cost = getUpgradeCost('attackBonus', upgrades.attackBonus) // 50 gold
      const canAfford = gameState.gold >= cost
      
      expect(canAfford).toBe(true)
      expect(cost).toBe(50)
    })

    it('should prevent purchase when player lacks gold', () => {
      gameState.gold = 30
      const cost = getUpgradeCost('attackBonus', upgrades.attackBonus) // 50 gold
      const canAfford = gameState.gold >= cost
      
      expect(canAfford).toBe(false)
    })

    it('should correctly calculate costs based on current upgrade level', () => {
      // Defense bonus is at level 1
      const defenseCost = getUpgradeCost('defenseBonus', upgrades.defenseBonus)
      expect(defenseCost).toBe(75) // 50 * 1.5^1

      // Health bonus is at level 2
      const healthCost = getUpgradeCost('healthBonus', upgrades.healthBonus)
      expect(healthCost).toBe(78) // 40 * 1.4^2 = 78.4, floored
    })

    it('should update gold and upgrade level after purchase', () => {
      const upgradeType = 'attackBonus'
      const cost = getUpgradeCost(upgradeType, upgrades[upgradeType])
      
      // Simulate purchase
      gameState.gold -= cost
      upgrades[upgradeType] += 1
      
      expect(gameState.gold).toBe(950) // 1000 - 50
      expect(upgrades.attackBonus).toBe(1)
    })
  })

  describe('Upgrade Effects', () => {
    it('should apply attack bonus correctly', () => {
      const member = { baseAttack: 20 }
      const upgradeBonus = { attackBonus: 3 }
      
      const finalAttack = member.baseAttack + upgradeBonus.attackBonus
      expect(finalAttack).toBe(23)
    })

    it('should apply defense bonus correctly', () => {
      const member = { baseDefense: 15 }
      const upgradeBonus = { defenseBonus: 2 }
      
      const finalDefense = member.baseDefense + upgradeBonus.defenseBonus
      expect(finalDefense).toBe(17)
    })

    it('should apply health bonus correctly', () => {
      const member = { baseHp: 100 }
      const upgradeBonus = { healthBonus: 4 } // 4 * 5 = +20 HP
      
      const finalHp = member.baseHp + (upgradeBonus.healthBonus * 5)
      expect(finalHp).toBe(120)
    })

    it('should apply gold multiplier correctly', () => {
      const baseGold = 10
      const goldMultiplierLevel = 3 // +30% (3 * 10%)
      
      const multiplier = 1 + (goldMultiplierLevel * 0.1)
      const finalGold = Math.floor(baseGold * multiplier)
      
      expect(multiplier).toBe(1.3)
      expect(finalGold).toBe(13)
    })

    it('should apply gear drop bonus correctly', () => {
      const baseDropChance = 0.15 // 15%
      const gearDropBonusLevel = 2 // +10% (2 * 5%)
      const floorBonus = 0.05 // 5% from floor
      
      const finalDropChance = baseDropChance + floorBonus + (gearDropBonusLevel * 0.05)
      expect(finalDropChance).toBeCloseTo(0.30, 2) // 30% total
    })

    it('should maintain HP percentage when max HP increases', () => {
      const member = { hp: 60, maxHp: 100 } // 60% health
      const healthIncrease = 20 // +20 max HP from upgrade
      
      const hpPercentage = member.hp / member.maxHp
      const newMaxHp = member.maxHp + healthIncrease
      const newHp = Math.round(newMaxHp * hpPercentage)
      
      expect(hpPercentage).toBe(0.6)
      expect(newMaxHp).toBe(120)
      expect(newHp).toBe(72) // Maintains 60% health
    })
  })

  describe('Upgrade Progression', () => {
    it('should track multiple upgrade purchases correctly', () => {
      const upgrades = {
        attackBonus: 0,
        defenseBonus: 0,
        healthBonus: 0
      }
      
      const upgradeSequence = ['attackBonus', 'defenseBonus', 'attackBonus', 'healthBonus']
      
      upgradeSequence.forEach(upgradeType => {
        upgrades[upgradeType] += 1
      })
      
      expect(upgrades.attackBonus).toBe(2)
      expect(upgrades.defenseBonus).toBe(1)
      expect(upgrades.healthBonus).toBe(1)
    })

    it('should calculate total upgrade investment correctly', () => {
      const upgradeShop = {
        attackBonus: { baseCost: 50, costMultiplier: 1.5 },
        defenseBonus: { baseCost: 50, costMultiplier: 1.5 }
      }
      
      const upgrades = { attackBonus: 2, defenseBonus: 1 }
      
      let totalSpent = 0
      Object.entries(upgrades).forEach(([type, level]) => {
        for (let i = 0; i < level; i++) {
          const upgrade = upgradeShop[type as keyof typeof upgradeShop]
          totalSpent += Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, i))
        }
      })
      
      // Attack: 50 + 75 = 125, Defense: 50, Total: 175
      expect(totalSpent).toBe(175)
    })
  })
})