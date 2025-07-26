import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PartyDisplay } from '../components/PartyDisplay'

// Mock Environment to return development mode
vi.mock('../utils/Environment', () => ({
  isDev: vi.fn(() => true),
  isProd: vi.fn(() => false)
}))

describe('PartyDisplay Kill Button (Development Mode)', () => {
  const mockSetParty = vi.fn()
  const mockGetGearIcon = vi.fn(() => () => <div>GearIcon</div>)
  
  const mockParty = [
    {
      name: 'Tank',
      role: 'tank',
      hp: 100,
      maxHp: 100,
      attack: 25,
      defense: 35,
      attackTimer: 0,
      icon: () => <div>TankIcon</div>,
      skill: { name: 'Shield Wall', cooldown: 8000 },
      skillCooldown: 0,
      skillActive: false,
      gear: { weapon: { name: 'Basic Sword', level: 1 } }
    },
    {
      name: 'Healer',
      role: 'healer', 
      hp: 50,
      maxHp: 80,
      attack: 15,
      defense: 20,
      attackTimer: 0,
      icon: () => <div>HealerIcon</div>,
      skill: { name: 'Heal', cooldown: 6000 },
      skillCooldown: 0,
      skillActive: false,
      gear: { weapon: { name: 'Basic Staff', level: 1 } }
    }
  ]

  const mockGameState = {
    inCombat: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show kill buttons for alive party members in development mode', () => {
    render(
      <PartyDisplay
        party={mockParty}
        gameState={mockGameState}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        setParty={mockSetParty}
      />
    )

    // Should show kill buttons for both alive party members
    const killButtons = screen.getAllByTitle(/\[DEV\] Kill .* for testing/)
    expect(killButtons).toHaveLength(2)
    expect(killButtons[0]).toHaveAttribute('title', '[DEV] Kill Tank for testing')
    expect(killButtons[1]).toHaveAttribute('title', '[DEV] Kill Healer for testing')
  })

  it('should not show kill button for dead party members', () => {
    const deadParty = [
      { ...mockParty[0], hp: 0 }, // Dead tank
      mockParty[1] // Alive healer
    ]

    render(
      <PartyDisplay
        party={deadParty}
        gameState={mockGameState}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        setParty={mockSetParty}
      />
    )

    // Should only show kill button for alive healer
    const killButtons = screen.getAllByTitle(/\[DEV\] Kill .* for testing/)
    expect(killButtons).toHaveLength(1)
    expect(killButtons[0]).toHaveAttribute('title', '[DEV] Kill Healer for testing')
  })

  it('should kill party member when kill button is clicked', () => {
    render(
      <PartyDisplay
        party={mockParty}
        gameState={mockGameState}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        setParty={mockSetParty}
      />
    )

    // Click the kill button for the Tank
    const tankKillButton = screen.getByTitle('[DEV] Kill Tank for testing')
    fireEvent.click(tankKillButton)

    // Should have called setParty with an updater function
    expect(mockSetParty).toHaveBeenCalledTimes(1)
    expect(mockSetParty).toHaveBeenCalledWith(expect.any(Function))

    // Test the updater function
    const updaterFunction = mockSetParty.mock.calls[0][0]
    const updatedParty = updaterFunction(mockParty)

    // Tank should be killed (HP = 0), Healer should be unchanged
    expect(updatedParty[0]).toEqual({ ...mockParty[0], hp: 0 })
    expect(updatedParty[1]).toEqual(mockParty[1])
  })

  it('should activate healer protection when healer kill button is clicked', () => {
    render(
      <PartyDisplay
        party={mockParty}
        gameState={mockGameState}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        setParty={mockSetParty}
      />
    )

    // Click the kill button for the Healer
    const healerKillButton = screen.getByTitle('[DEV] Kill Healer for testing')
    fireEvent.click(healerKillButton)

    // Should have called setParty with an updater function
    expect(mockSetParty).toHaveBeenCalledTimes(1)
    expect(mockSetParty).toHaveBeenCalledWith(expect.any(Function))

    // Test the updater function
    const updaterFunction = mockSetParty.mock.calls[0][0]
    const updatedParty = updaterFunction(mockParty)

    // Tank should be unchanged, Healer should be protected with 1 HP
    expect(updatedParty[0]).toEqual(mockParty[0])
    expect(updatedParty[1]).toEqual({ 
      ...mockParty[1], 
      hp: 1, 
      isProtected: true 
    })
  })

  it('should not damage protected healer when kill button is clicked', () => {
    const protectedParty = [
      mockParty[0],
      { ...mockParty[1], isProtected: true }
    ]

    render(
      <PartyDisplay
        party={protectedParty}
        gameState={mockGameState}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        setParty={mockSetParty}
      />
    )

    // Click the kill button for the protected Healer
    const healerKillButton = screen.getByTitle('[DEV] Kill Healer for testing')
    fireEvent.click(healerKillButton)

    // Should have called setParty with an updater function
    expect(mockSetParty).toHaveBeenCalledTimes(1)
    expect(mockSetParty).toHaveBeenCalledWith(expect.any(Function))

    // Test the updater function
    const updaterFunction = mockSetParty.mock.calls[0][0]
    const updatedParty = updaterFunction(protectedParty)

    // Both members should be unchanged (protected healer takes no damage)
    expect(updatedParty[0]).toEqual(protectedParty[0])
    expect(updatedParty[1]).toEqual(protectedParty[1])
  })

  it('should not show kill buttons when setParty is not provided', () => {
    render(
      <PartyDisplay
        party={mockParty}
        gameState={mockGameState}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        // No setParty prop
      />
    )

    // Should not show any kill buttons
    const killButtons = screen.queryAllByTitle(/\[DEV\] Kill .* for testing/)
    expect(killButtons).toHaveLength(0)
  })
})

describe('PartyDisplay Kill Button (Production Mode)', () => {
  beforeEach(async () => {
    // Mock Environment to return production mode
    const { isDev } = await import('../utils/Environment')
    vi.mocked(isDev).mockReturnValue(false)
  })

  it('should not show kill buttons in production mode', () => {
    const mockSetParty = vi.fn()
    const mockGetGearIcon = vi.fn(() => () => <div>GearIcon</div>)
    
    const mockParty = [
      {
        name: 'Tank',
        role: 'tank',
        hp: 100,
        maxHp: 100,
        attack: 25,
        defense: 35,
        attackTimer: 0,
        icon: () => <div>TankIcon</div>,
        skill: { name: 'Shield Wall' },
        skillCooldown: 0,
        skillActive: false,
        gear: { weapon: { name: 'Basic Sword', level: 1 } }
      }
    ]

    render(
      <PartyDisplay
        party={mockParty}
        gameState={{ inCombat: true }}
        gameSpeed={1000}
        getGearIcon={mockGetGearIcon}
        setParty={mockSetParty}
      />
    )

    // Should not show any kill buttons in production
    const killButtons = screen.queryAllByTitle(/\[DEV\] Kill .* for testing/)
    expect(killButtons).toHaveLength(0)
  })
})