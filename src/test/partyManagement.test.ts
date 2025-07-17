import { describe, it, expect, beforeEach } from 'vitest'

describe('Party Management System', () => {
  describe('Party Initialization', () => {
    const dpsClasses = {
      warrior: {
        name: 'Warrior',
        baseStats: { hp: 75, attack: 35, defense: 12 },
        attackSpeed: 1.0
      },
      rogue: {
        name: 'Rogue',
        baseStats: { hp: 65, attack: 25, defense: 8 },
        attackSpeed: 1.4
      },
      mage: {
        name: 'Mage',
        baseStats: { hp: 60, attack: 40, defense: 6 },
        attackSpeed: 0.7
      }
    }

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
      }
    }

    const initializeParty = () => {
      const baseMembersData = [
        { 
          name: "Tank", 
          role: "tank", 
          baseHp: 100, 
          baseAttack: 15, 
          baseDefense: 25,
          skill: skills.tank,
          skillCooldown: 0,
          skillActive: false,
          skillDuration: 0
        },
        { 
          name: "Healer", 
          role: "healer", 
          baseHp: 80, 
          baseAttack: 10, 
          baseDefense: 15,
          skill: skills.healer,
          skillCooldown: 0,
          skillActive: false,
          skillDuration: 0,
          isProtected: false
        },
        { 
          name: "Warrior", 
          role: "warrior", 
          dpsClass: "warrior",
          baseHp: dpsClasses.warrior.baseStats.hp, 
          baseAttack: dpsClasses.warrior.baseStats.attack, 
          baseDefense: dpsClasses.warrior.baseStats.defense,
          attackSpeed: dpsClasses.warrior.attackSpeed
        }
      ]
      
      return baseMembersData.map(member => ({
        ...member,
        hp: member.baseHp,
        maxHp: member.baseHp,
        attack: member.baseAttack,
        defense: member.baseDefense,
        attackTimer: 0
      }))
    }

    it('should initialize party with correct member count', () => {
      const party = initializeParty()
      expect(party).toHaveLength(3)
    })

    it('should initialize tank with correct stats', () => {
      const party = initializeParty()
      const tank = party.find(member => member.role === 'tank')
      
      expect(tank).toBeTruthy()
      expect(tank?.name).toBe('Tank')
      expect(tank?.hp).toBe(100)
      expect(tank?.maxHp).toBe(100)
      expect(tank?.attack).toBe(15)
      expect(tank?.defense).toBe(25)
      expect(tank?.skill.name).toBe('Shield Wall')
    })

    it('should initialize healer with correct stats and protection state', () => {
      const party = initializeParty()
      const healer = party.find(member => member.role === 'healer')
      
      expect(healer).toBeTruthy()
      expect(healer?.name).toBe('Healer')
      expect(healer?.hp).toBe(80)
      expect(healer?.isProtected).toBe(false)
      expect(healer?.skill.name).toBe('Healing Light')
    })

    it('should initialize DPS classes with correct stats and attack speed', () => {
      const party = initializeParty()
      const warrior = party.find(member => member.role === 'warrior')
      
      expect(warrior).toBeTruthy()
      expect(warrior?.dpsClass).toBe('warrior')
      expect(warrior?.hp).toBe(75)
      expect(warrior?.attack).toBe(35)
      expect(warrior?.defense).toBe(12)
      expect(warrior?.attackSpeed).toBe(1.0)
    })

    it('should initialize all members with zero attack timer', () => {
      const party = initializeParty()
      
      party.forEach(member => {
        expect(member.attackTimer).toBe(0)
      })
    })
  })

  describe('Party Stats Calculation', () => {
    let party: any[]

    beforeEach(() => {
      party = [
        { name: 'Tank', hp: 100, attack: 20, defense: 25 },
        { name: 'Healer', hp: 0, attack: 15, defense: 15 }, // Dead
        { name: 'Warrior', hp: 75, attack: 35, defense: 12 }
      ]
    })

    const getPartyStats = (partyMembers: any[]) => {
      const aliveMembers = partyMembers.filter(member => member.hp > 0)
      const totalAttack = aliveMembers.reduce((sum, member) => sum + member.attack, 0)
      const totalDefense = aliveMembers.reduce((sum, member) => sum + member.defense, 0)
      return { totalAttack, totalDefense, aliveMembers: aliveMembers.length }
    }

    it('should calculate stats for alive members only', () => {
      const stats = getPartyStats(party)
      
      expect(stats.aliveMembers).toBe(2) // Tank and Warrior
      expect(stats.totalAttack).toBe(55) // 20 + 35
      expect(stats.totalDefense).toBe(37) // 25 + 12
    })

    it('should return zero stats when all members are dead', () => {
      const deadParty = party.map(member => ({ ...member, hp: 0 }))
      const stats = getPartyStats(deadParty)
      
      expect(stats.aliveMembers).toBe(0)
      expect(stats.totalAttack).toBe(0)
      expect(stats.totalDefense).toBe(0)
    })

    it('should handle party with all members alive', () => {
      const aliveParty = party.map(member => ({ ...member, hp: Math.max(1, member.hp) }))
      const stats = getPartyStats(aliveParty)
      
      expect(stats.aliveMembers).toBe(3)
      expect(stats.totalAttack).toBe(70) // 20 + 15 + 35
      expect(stats.totalDefense).toBe(52) // 25 + 15 + 12
    })
  })

  describe('Party Health Management', () => {
    it('should correctly identify low health members', () => {
      const party = [
        { name: 'Tank', hp: 100, maxHp: 100 },
        { name: 'Healer', hp: 20, maxHp: 80 }, // 25% health
        { name: 'Warrior', hp: 15, maxHp: 75 }  // 20% health
      ]

      const lowHealthMembers = party.filter(member => {
        const hpPercent = (member.hp / member.maxHp) * 100
        return hpPercent <= 30 && member.hp > 0
      })

      expect(lowHealthMembers).toHaveLength(2)
      expect(lowHealthMembers[0].name).toBe('Healer')
      expect(lowHealthMembers[1].name).toBe('Warrior')
    })

    it('should find most injured member for healing', () => {
      const party = [
        { name: 'Tank', hp: 80, maxHp: 100 },    // 80% health
        { name: 'Healer', hp: 20, maxHp: 80 },   // 25% health - most injured
        { name: 'Warrior', hp: 30, maxHp: 75 }   // 40% health
      ]

      const injuredMembers = party.filter(m => m.hp > 0 && m.hp < m.maxHp)
      const mostInjured = injuredMembers.reduce((prev, curr) => 
        (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev
      )

      expect(mostInjured.name).toBe('Healer')
      expect(mostInjured.hp / mostInjured.maxHp).toBe(0.25)
    })

    it('should correctly apply healing', () => {
      const healer = { name: 'Healer', hp: 20, maxHp: 80 }
      const healAmount = Math.floor(healer.maxHp * 0.4) // 40% of max HP
      
      const newHp = Math.min(healer.maxHp, healer.hp + healAmount)
      
      expect(healAmount).toBe(32)
      expect(newHp).toBe(52) // 20 + 32, doesn't exceed max
    })

    it('should not overheal beyond max HP', () => {
      const healer = { name: 'Healer', hp: 70, maxHp: 80 }
      const healAmount = 50
      
      const newHp = Math.min(healer.maxHp, healer.hp + healAmount)
      
      expect(newHp).toBe(80) // Capped at max HP
    })
  })

  describe('Attack Speed System', () => {
    it('should calculate correct attack timer increments for different speeds', () => {
      const gameSpeed = 1500
      const baseIncrement = 100 / (gameSpeed / 100) // Base increment per 100ms

      const warriors = [
        { name: 'Fast Rogue', attackSpeed: 1.4, attackTimer: 0 },
        { name: 'Normal Warrior', attackSpeed: 1.0, attackTimer: 0 },
        { name: 'Slow Mage', attackSpeed: 0.7, attackTimer: 0 }
      ]

      warriors.forEach(warrior => {
        const increment = baseIncrement * warrior.attackSpeed
        warrior.attackTimer += increment
      })

      // Fast rogue should have highest timer
      expect(warriors[0].attackTimer).toBeGreaterThan(warriors[1].attackTimer)
      expect(warriors[1].attackTimer).toBeGreaterThan(warriors[2].attackTimer)
    })

    it('should determine when members are ready to attack', () => {
      const members = [
        { name: 'Ready', attackTimer: 100 },
        { name: 'Almost', attackTimer: 95 },
        { name: 'Not Ready', attackTimer: 50 }
      ]

      const readyMembers = members.filter(member => member.attackTimer >= 100)
      
      expect(readyMembers).toHaveLength(1)
      expect(readyMembers[0].name).toBe('Ready')
    })
  })
})