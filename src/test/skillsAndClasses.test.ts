import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Skills and DPS Classes System', () => {
  describe('DPS Class Definitions', () => {
    const dpsClasses = {
      warrior: {
        name: 'Warrior',
        description: 'Heavy melee fighter with high damage and moderate speed',
        baseStats: { hp: 75, attack: 35, defense: 12 },
        attackSpeed: 1.0,
        color: 'red'
      },
      rogue: {
        name: 'Rogue',
        description: 'Fast assassin with quick strikes and lower damage',
        baseStats: { hp: 65, attack: 25, defense: 8 },
        attackSpeed: 1.4,
        color: 'purple'
      },
      mage: {
        name: 'Mage',
        description: 'Magical damage dealer with slow but powerful spells',
        baseStats: { hp: 60, attack: 40, defense: 6 },
        attackSpeed: 0.7,
        color: 'blue'
      }
    }

    it('should define three DPS classes with correct stats', () => {
      expect(Object.keys(dpsClasses)).toHaveLength(3)
      expect(dpsClasses.warrior.baseStats.attack).toBe(35)
      expect(dpsClasses.rogue.baseStats.attack).toBe(25)
      expect(dpsClasses.mage.baseStats.attack).toBe(40)
    })

    it('should have balanced HP across classes', () => {
      const hpValues = Object.values(dpsClasses).map(cls => cls.baseStats.hp)
      const totalHp = hpValues.reduce((sum, hp) => sum + hp, 0)
      const avgHp = totalHp / hpValues.length
      
      expect(avgHp).toBeCloseTo(66.7, 1) // Average around 67 HP
      expect(Math.max(...hpValues) - Math.min(...hpValues)).toBeLessThanOrEqual(15) // HP spread ≤ 15
    })

    it('should have attack speed variation that balances DPS', () => {
      const warrior = dpsClasses.warrior
      const rogue = dpsClasses.rogue
      const mage = dpsClasses.mage
      
      // Calculate effective DPS (attack * attack speed)
      const warriorDPS = warrior.baseStats.attack * warrior.attackSpeed
      const rogueDPS = rogue.baseStats.attack * rogue.attackSpeed
      const mageDPS = mage.baseStats.attack * mage.attackSpeed
      
      expect(warriorDPS).toBe(35) // 35 * 1.0
      expect(rogueDPS).toBe(35) // 25 * 1.4
      expect(mageDPS).toBe(28) // 40 * 0.7
      
      // DPS should be relatively balanced
      const dpsValues = [warriorDPS, rogueDPS, mageDPS]
      const maxDPS = Math.max(...dpsValues)
      const minDPS = Math.min(...dpsValues)
      expect(maxDPS - minDPS).toBeLessThanOrEqual(10)
    })

    it('should have unique color assignments', () => {
      const colors = Object.values(dpsClasses).map(cls => cls.color)
      const uniqueColors = [...new Set(colors)]
      
      expect(uniqueColors).toHaveLength(colors.length)
    })
  })

  describe('Skill Definitions', () => {
    const skills = {
      tank: {
        name: 'Shield Wall',
        description: 'Reduces incoming damage to all party members by 50% for 3 turns',
        cooldown: 8000,
        effect: { type: 'damage_reduction', value: 0.5, duration: 3 }
      },
      healer: {
        name: 'Healing Light',
        description: 'Heals the most injured party member for 40% of their max HP',
        cooldown: 6000,
        effect: { type: 'heal', value: 0.4 }
      },
      warrior: {
        name: 'Blade Storm',
        description: 'Unleashes a flurry of attacks dealing 180% weapon damage',
        cooldown: 6000,
        effect: { type: 'damage_boost', value: 1.8 }
      },
      rogue: {
        name: 'Shadow Strike',
        description: 'Quick assassination attempt dealing 150% weapon damage',
        cooldown: 4000,
        effect: { type: 'damage_boost', value: 1.5 }
      },
      mage: {
        name: 'Arcane Blast',
        description: 'Devastating spell dealing 250% weapon damage',
        cooldown: 8000,
        effect: { type: 'damage_boost', value: 2.5 }
      }
    }

    it('should define skills for all classes', () => {
      const expectedClasses = ['tank', 'healer', 'warrior', 'rogue', 'mage']
      expectedClasses.forEach(className => {
        expect(skills).toHaveProperty(className)
      })
    })

    it('should have appropriate cooldowns relative to power', () => {
      // More powerful skills should generally have longer cooldowns
      expect(skills.mage.cooldown).toBeGreaterThan(skills.rogue.cooldown) // Mage stronger than rogue
      expect(skills.tank.cooldown).toBeGreaterThan(skills.healer.cooldown) // Tank defensive > healing
    })

    it('should have damage boost skills with reasonable multipliers', () => {
      const damageBoosts = Object.values(skills)
        .filter(skill => skill.effect.type === 'damage_boost')
        .map(skill => skill.effect.value)
      
      damageBoosts.forEach(multiplier => {
        expect(multiplier).toBeGreaterThan(1.0) // All boosts should increase damage
        expect(multiplier).toBeLessThanOrEqual(3.0) // Reasonable upper limit
      })
    })

    it('should balance damage boost with cooldown', () => {
      const damageSkills = Object.entries(skills)
        .filter(([_, skill]) => skill.effect.type === 'damage_boost')
      
      // Calculate damage per second efficiency (damage multiplier / cooldown in seconds)
      const efficiencies = damageSkills.map(([name, skill]) => ({
        name,
        efficiency: (skill.effect.value - 1) / (skill.cooldown / 1000)
      }))
      
      // All efficiencies should be relatively close
      const effValues = efficiencies.map(e => e.efficiency)
      const maxEff = Math.max(...effValues)
      const minEff = Math.min(...effValues)
      expect(maxEff / minEff).toBeLessThan(3) // No more than 3x difference
    })
  })

  describe('Skill Processing Logic', () => {
    let party: any[]
    let gameState: any

    beforeEach(() => {
      party = [
        { 
          name: 'Tank', 
          role: 'tank', 
          hp: 100, 
          maxHp: 100,
          skill: {
            name: 'Shield Wall',
            cooldown: 8000,
            effect: { type: 'damage_reduction', value: 0.5, duration: 3 }
          },
          skillCooldown: 0,
          skillActive: false,
          skillDuration: 0
        },
        { 
          name: 'Healer', 
          role: 'healer', 
          hp: 80, 
          maxHp: 80,
          skill: {
            name: 'Healing Light',
            cooldown: 6000,
            effect: { type: 'heal', value: 0.4 }
          },
          skillCooldown: 0,
          skillActive: false,
          skillDuration: 0,
          isProtected: false
        },
        { 
          name: 'Injured Warrior', 
          role: 'warrior', 
          hp: 20, 
          maxHp: 75,
          skill: {
            name: 'Blade Storm',
            cooldown: 6000,
            effect: { type: 'damage_boost', value: 1.8 }
          },
          skillCooldown: 0,
          skillActive: false,
          skillDuration: 0
        }
      ]

      gameState = { gameSpeed: 1500 }
    })

    const processSkillCooldowns = (partyMembers: any[], gameSpeed: number) => {
      return partyMembers.map(member => ({
        ...member,
        skillCooldown: Math.max(0, member.skillCooldown - gameSpeed)
      }))
    }

    const findHealTarget = (partyMembers: any[]) => {
      const injuredMembers = partyMembers.filter(m => m.hp > 0 && m.hp < m.maxHp)
      if (injuredMembers.length === 0) return null
      
      return injuredMembers.reduce((prev, curr) => 
        (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev
      )
    }

    it('should reduce skill cooldowns over time', () => {
      party[0].skillCooldown = 3000 // 3 seconds remaining
      
      const updatedParty = processSkillCooldowns(party, gameState.gameSpeed)
      
      expect(updatedParty[0].skillCooldown).toBe(1500) // 3000 - 1500
    })

    it('should not reduce cooldown below zero', () => {
      party[0].skillCooldown = 1000 // 1 second remaining
      
      const updatedParty = processSkillCooldowns(party, gameState.gameSpeed)
      
      expect(updatedParty[0].skillCooldown).toBe(0) // Should not go negative
    })

    it('should identify most injured party member for healing', () => {
      const healTarget = findHealTarget(party)
      
      expect(healTarget?.name).toBe('Injured Warrior') // 20/75 = 26.7% health
    })

    it('should not target dead members for healing', () => {
      party[2].hp = 0 // Kill the injured warrior
      const healTarget = findHealTarget(party)
      
      expect(healTarget).toBeNull() // No injured alive members
    })

    it('should calculate correct heal amount', () => {
      const target = party[2] // Injured Warrior with 20/75 HP
      const healPercent = 0.4 // 40% of max HP
      const healAmount = Math.floor(target.maxHp * healPercent)
      
      expect(healAmount).toBe(30) // 75 * 0.4 = 30
      
      const newHp = Math.min(target.maxHp, target.hp + healAmount)
      expect(newHp).toBe(50) // 20 + 30 = 50
    })

    it('should prevent overheal', () => {
      party[0].hp = 90 // Tank at 90/100 HP
      const healAmount = 40 // Large heal
      
      const newHp = Math.min(party[0].maxHp, party[0].hp + healAmount)
      expect(newHp).toBe(100) // Capped at max HP
    })

    it('should not cast skills when dead', () => {
      party[1].hp = 0 // Dead healer
      const canCast = party[1].hp > 0 && party[1].skillCooldown <= 0
      
      expect(canCast).toBe(false)
    })

    it('should not cast skills when protected healer', () => {
      party[1].isProtected = true
      const canCast = party[1].hp > 0 && party[1].skillCooldown <= 0 && !party[1].isProtected
      
      expect(canCast).toBe(false)
    })

    it('should activate damage boost skills correctly', () => {
      const warrior = party[2]
      
      // Simulate casting damage boost skill
      const updatedWarrior = {
        ...warrior,
        skillActive: true,
        skillDuration: 1,
        skillCooldown: warrior.skill.cooldown
      }
      
      expect(updatedWarrior.skillActive).toBe(true)
      expect(updatedWarrior.skillDuration).toBe(1)
      expect(updatedWarrior.skillCooldown).toBe(6000)
    })
  })

  describe('Skill Balance Analysis', () => {
    const skills = {
      warrior: { cooldown: 6000, effect: { value: 1.8 } },
      rogue: { cooldown: 4000, effect: { value: 1.5 } },
      mage: { cooldown: 8000, effect: { value: 2.5 } }
    }

    it('should have balanced damage per cooldown ratios', () => {
      const ratios = Object.entries(skills).map(([name, skill]) => ({
        name,
        ratio: (skill.effect.value - 1) / (skill.cooldown / 1000)
      }))
      
      // Warrior: 0.8 / 6 = 0.133
      // Rogue: 0.5 / 4 = 0.125  
      // Mage: 1.5 / 8 = 0.1875
      
      const ratioValues = ratios.map(r => r.ratio)
      const avgRatio = ratioValues.reduce((sum, r) => sum + r, 0) / ratioValues.length
      
      // All ratios should be within reasonable range of average
      ratioValues.forEach(ratio => {
        expect(Math.abs(ratio - avgRatio)).toBeLessThan(0.1)
      })
    })

    it('should have appropriate power scaling with cooldown', () => {
      // Longer cooldowns should generally mean more power
      const skillsByPower = Object.entries(skills)
        .sort((a, b) => a[1].effect.value - b[1].effect.value)
      
      const skillsByCooldown = Object.entries(skills)
        .sort((a, b) => a[1].cooldown - b[1].cooldown)
      
      // Mage should have highest power and cooldown
      expect(skillsByPower[2][0]).toBe('mage')
      expect(skillsByCooldown[2][0]).toBe('mage')
    })
  })
})