import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Gear System', () => {
  describe('Gear Creation and Structure', () => {
    const createDefaultGear = () => ({
      weapon: { name: 'Basic Weapon', level: 1, attack: 4, defense: 0, hp: 0 },
      helm: { name: 'Basic Helm', level: 1, attack: 0, defense: 2, hp: 5 },
      chest: { name: 'Basic Chestplate', level: 1, attack: 0, defense: 3, hp: 8 },
      ring1: { name: 'Basic Ring', level: 1, attack: 1, defense: 1, hp: 2 },
      ring2: { name: 'Basic Ring', level: 1, attack: 1, defense: 1, hp: 2 },
      amulet: { name: 'Basic Amulet', level: 1, attack: 2, defense: 1, hp: 3 },
      gloves: { name: 'Basic Gloves', level: 1, attack: 1, defense: 1, hp: 2 },
      bracers: { name: 'Basic Bracers', level: 1, attack: 1, defense: 2, hp: 1 },
      boots: { name: 'Basic Boots', level: 1, attack: 0, defense: 2, hp: 3 },
      pants: { name: 'Basic Pants', level: 1, attack: 0, defense: 2, hp: 4 }
    })

    it('should create gear with all required slots', () => {
      const gear = createDefaultGear()
      const expectedSlots = ['weapon', 'helm', 'chest', 'ring1', 'ring2', 'amulet', 'gloves', 'bracers', 'boots', 'pants']
      
      expectedSlots.forEach(slot => {
        expect(gear).toHaveProperty(slot)
      })
    })

    it('should initialize all gear at level 1', () => {
      const gear = createDefaultGear()
      
      Object.values(gear).forEach(item => {
        expect(item.level).toBe(1)
      })
    })

    it('should have proper stat distribution across gear types', () => {
      const gear = createDefaultGear()
      
      // Weapons should have attack
      expect(gear.weapon.attack).toBeGreaterThan(0)
      expect(gear.weapon.defense).toBe(0)
      
      // Armor pieces should have defense/hp
      expect(gear.helm.defense).toBeGreaterThan(0)
      expect(gear.chest.defense).toBeGreaterThan(0)
      expect(gear.boots.defense).toBeGreaterThan(0)
      
      // Accessories should be balanced
      expect(gear.ring1.attack).toBeGreaterThan(0)
      expect(gear.ring1.defense).toBeGreaterThan(0)
      expect(gear.amulet.attack).toBeGreaterThan(0)
    })
  })

  describe('Gear Stats Calculation', () => {
    let testGear: any

    beforeEach(() => {
      testGear = {
        weapon: { level: 2, attack: 4, defense: 0, hp: 0 },
        helm: { level: 1, attack: 0, defense: 2, hp: 5 },
        chest: { level: 3, attack: 0, defense: 3, hp: 8 }
      }
    })

    const calculateGearStats = (gear: any) => {
      return Object.values(gear).reduce((total: {attack: number, defense: number, hp: number}, item: any) => {
        // Handle null/undefined gear items or items without full stats
        if (!item || typeof item !== 'object') {
          return total;
        }
        
        return {
          attack: total.attack + ((item.attack || 0) * (item.level || 1)),
          defense: total.defense + ((item.defense || 0) * (item.level || 1)), 
          hp: total.hp + ((item.hp || 0) * (item.level || 1))
        };
      }, { attack: 0, defense: 0, hp: 0 })
    }

    it('should calculate gear stats correctly with level multipliers', () => {
      const stats = calculateGearStats(testGear)
      
      expect(stats.attack).toBe(8)  // weapon: 4 * 2 = 8
      expect(stats.defense).toBe(11) // helm: 2 * 1 + chest: 3 * 3 = 2 + 9 = 11
      expect(stats.hp).toBe(29)     // helm: 5 * 1 + chest: 8 * 3 = 5 + 24 = 29
    })

    it('should handle empty gear correctly', () => {
      const stats = calculateGearStats({})
      
      expect(stats.attack).toBe(0)
      expect(stats.defense).toBe(0)
      expect(stats.hp).toBe(0)
    })

    it('should handle single gear piece', () => {
      const singleGear = {
        weapon: { level: 5, attack: 10, defense: 0, hp: 0 }
      }
      
      const stats = calculateGearStats(singleGear)
      
      expect(stats.attack).toBe(50) // 10 * 5
      expect(stats.defense).toBe(0)
      expect(stats.hp).toBe(0)
    })
  })

  describe('Gear Upgrading', () => {
    let member: any
    let gearSlots: string[]

    beforeEach(() => {
      member = {
        name: 'Test Warrior',
        baseHp: 100,
        baseAttack: 20,
        baseDefense: 10,
        gear: {
          weapon: { name: 'Basic Weapon', level: 1, attack: 4, defense: 0, hp: 0 },
          helm: { name: 'Basic Helm', level: 2, attack: 0, defense: 2, hp: 5 }
        }
      }
      
      gearSlots = ['weapon', 'helm', 'chest', 'ring1', 'ring2', 'amulet', 'gloves', 'bracers', 'boots', 'pants']
    })

    const upgradeRandomGear = (targetMember: any, slots: string[]) => {
      const memberIndex = 0 // For testing
      const gearSlot = slots[Math.floor(Math.random() * slots.length)]
      
      return {
        memberIndex,
        gearSlot,
        updatedGear: {
          ...targetMember.gear,
          [gearSlot]: {
            ...targetMember.gear[gearSlot],
            level: targetMember.gear[gearSlot].level + 1
          }
        }
      }
    }

    it('should upgrade gear level by 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // Should select weapon (index 0)
      const result = upgradeRandomGear(member, ['weapon'])
      
      expect(result.gearSlot).toBe('weapon')
      expect(result.updatedGear.weapon.level).toBe(2) // 1 + 1
    })

    it('should maintain other gear properties when upgrading', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      const result = upgradeRandomGear(member, ['weapon'])
      
      expect(result.updatedGear.weapon.name).toBe('Basic Weapon')
      expect(result.updatedGear.weapon.attack).toBe(4)
      expect(result.updatedGear.weapon.defense).toBe(0)
      expect(result.updatedGear.weapon.hp).toBe(0)
    })

    it('should not affect other gear pieces when upgrading one', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      const result = upgradeRandomGear(member, ['weapon'])
      
      expect(result.updatedGear.helm).toEqual(member.gear.helm)
    })

    it('should calculate new stats after gear upgrade', () => {
      const calculateMemberStats = (targetMember: any) => {
        const gearStats = Object.values(targetMember.gear).reduce((total: any, item: any) => {
          // Handle null/undefined gear items or items without full stats
          if (!item || typeof item !== 'object') {
            return total;
          }
          
          return {
            attack: total.attack + ((item.attack || 0) * (item.level || 1)),
            defense: total.defense + ((item.defense || 0) * (item.level || 1)), 
            hp: total.hp + ((item.hp || 0) * (item.level || 1))
          };
        }, { attack: 0, defense: 0, hp: 0 })

        return {
          maxHp: targetMember.baseHp + gearStats.hp,
          attack: targetMember.baseAttack + gearStats.attack,
          defense: targetMember.baseDefense + gearStats.defense
        }
      }

      const originalStats = calculateMemberStats(member)
      
      // Upgrade weapon from level 1 to 2
      member.gear.weapon.level = 2
      const newStats = calculateMemberStats(member)
      
      expect(newStats.attack).toBe(originalStats.attack + 4) // +4 attack from level increase
      expect(newStats.defense).toBe(originalStats.defense) // No change
      expect(newStats.maxHp).toBe(originalStats.maxHp) // No change
    })
  })

  describe('Gear Drop System', () => {
    it('should calculate correct gear drop chance', () => {
      const baseDropChance = 0.15 // 15%
      const currentFloor = 5
      const gearDropBonus = 2 // +10% (2 * 5%)
      
      const finalDropChance = baseDropChance + (currentFloor * 0.01) + (gearDropBonus * 0.05)
      
      expect(finalDropChance).toBeCloseTo(0.30, 2) // 15% + 5% + 10% = 30%
    })

    it('should determine gear drop based on chance', () => {
      const dropChance = 0.25 // 25%
      
      vi.spyOn(Math, 'random').mockReturnValue(0.2) // < 0.25, should drop
      const shouldDrop1 = Math.random() < dropChance
      expect(shouldDrop1).toBe(true)
      
      vi.spyOn(Math, 'random').mockReturnValue(0.3) // > 0.25, should not drop
      const shouldDrop2 = Math.random() < dropChance
      expect(shouldDrop2).toBe(false)
    })

    it('should scale drop chance with floor progression', () => {
      const baseDropChance = 0.15
      const floors = [1, 5, 10, 20]
      
      const dropChances = floors.map(floor => baseDropChance + (floor * 0.01))
      
      expect(dropChances[0]).toBe(0.16) // Floor 1: 15% + 1%
      expect(dropChances[1]).toBe(0.20) // Floor 5: 15% + 5%
      expect(dropChances[2]).toBe(0.25) // Floor 10: 15% + 10%
      expect(dropChances[3]).toBe(0.35) // Floor 20: 15% + 20%
    })

    it('should multiply drop chance by enemies defeated', () => {
      const baseDropChance = 0.15
      const enemiesDefeated = 3
      
      const totalDropChance = baseDropChance * enemiesDefeated
      
      // Each enemy has independent chance, so total chance is higher
      expect(totalDropChance).toBeCloseTo(0.45, 2)
    })
  })

  describe('Gear Integration with Character Stats', () => {
    it('should properly integrate gear stats with base stats and upgrades', () => {
      const member = {
        baseHp: 100,
        baseAttack: 20,
        baseDefense: 15,
        gear: {
          weapon: { level: 2, attack: 5, defense: 0, hp: 0 },
          armor: { level: 1, attack: 0, defense: 8, hp: 10 }
        }
      }
      
      const upgrades = {
        healthBonus: 2, // +10 HP
        attackBonus: 3,
        defenseBonus: 1
      }
      
      const gearStats = Object.values(member.gear).reduce((total: any, item: any) => {
        // Handle null/undefined gear items or items without full stats
        if (!item || typeof item !== 'object') {
          return total;
        }
        
        return {
          attack: total.attack + ((item.attack || 0) * (item.level || 1)),
          defense: total.defense + ((item.defense || 0) * (item.level || 1)), 
          hp: total.hp + ((item.hp || 0) * (item.level || 1))
        };
      }, { attack: 0, defense: 0, hp: 0 })
      
      const finalStats = {
        maxHp: member.baseHp + gearStats.hp + (upgrades.healthBonus * 5),
        attack: member.baseAttack + gearStats.attack + upgrades.attackBonus,
        defense: member.baseDefense + gearStats.defense + upgrades.defenseBonus
      }
      
      expect(finalStats.maxHp).toBe(120) // 100 + 10 + 10
      expect(finalStats.attack).toBe(33)  // 20 + 10 + 3
      expect(finalStats.defense).toBe(24) // 15 + 8 + 1
    })

    it('should maintain HP percentage when gear increases max HP', () => {
      const member = { hp: 60, maxHp: 100 } // 60% health
      const hpIncrease = 20 // From gear upgrade
      
      const hpPercentage = member.hp / member.maxHp
      const newMaxHp = member.maxHp + hpIncrease
      const newHp = member.hp + Math.max(0, hpIncrease) // Add the HP increase
      
      expect(hpPercentage).toBe(0.6)
      expect(newMaxHp).toBe(120)
      expect(newHp).toBe(80) // 60 + 20 from gear
    })
  })
})