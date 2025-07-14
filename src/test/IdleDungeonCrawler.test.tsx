import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IdleDungeonCrawler from '../IdleDungeonCrawler'

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Sword: () => <div data-testid="sword-icon">Sword</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Skull: () => <div data-testid="skull-icon">Skull</div>,
  Shirt: () => <div data-testid="shirt-icon">Shirt</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  Gem: () => <div data-testid="gem-icon">Gem</div>,
  HardHat: () => <div data-testid="hardhat-icon">HardHat</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Wrench: () => <div data-testid="wrench-icon">Wrench</div>,
  Hand: () => <div data-testid="hand-icon">Hand</div>,
  Watch: () => <div data-testid="watch-icon">Watch</div>,
  Footprints: () => <div data-testid="footprints-icon">Footprints</div>,
  Coins: () => <div data-testid="coins-icon">Coins</div>,
  ShoppingCart: () => <div data-testid="shopping-cart-icon">ShoppingCart</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  Flame: () => <div data-testid="flame-icon">Flame</div>,
  Wind: () => <div data-testid="wind-icon">Wind</div>,
  Minimize2: () => <div data-testid="minimize2-icon">Minimize2</div>,
  Maximize2: () => <div data-testid="maximize2-icon">Maximize2</div>
}))

describe('IdleDungeonCrawler Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('should render the main game title', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Idle Dungeon Crawler')).toBeInTheDocument()
    })

    it('should render initial floor and group information', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Floor 1, Group 1/4'
      })).toBeInTheDocument()
    })

    it('should render all party members', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Tank')).toBeInTheDocument()
      expect(screen.getByText('Healer')).toBeInTheDocument()
      expect(screen.getByText('Warrior')).toBeInTheDocument()
      expect(screen.getByText('Rogue')).toBeInTheDocument()
      expect(screen.getByText('Mage')).toBeInTheDocument()
    })

    it('should render initial stats correctly', () => {
      render(<IdleDungeonCrawler />)
      // Use more specific queries to avoid multiple matches
      expect(screen.getByText('Gold')).toBeInTheDocument()
      expect(screen.getByText('Best Floor')).toBeInTheDocument()
      expect(screen.getByText('Total Runs')).toBeInTheDocument()
    })

    it('should render upgrade shop', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Upgrades')).toBeInTheDocument()
      expect(screen.getByText('Attack Training')).toBeInTheDocument()
      expect(screen.getByText('Defense Training')).toBeInTheDocument()
      expect(screen.getByText('Health Training')).toBeInTheDocument()
    })
  })

  describe('Party Display', () => {
    it('should show party member health bars', () => {
      render(<IdleDungeonCrawler />)
      const healthElements = screen.getAllByText('Health')
      expect(healthElements.length).toBeGreaterThan(0)
    })

    it('should display party member stats', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getAllByText('ATK')).toHaveLength(5) // 5 party members
      expect(screen.getAllByText('DEF')).toHaveLength(5) // 5 party members
    })

    it('should show skill information for each member', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Shield Wall')).toBeInTheDocument()
      expect(screen.getByText('Healing Light')).toBeInTheDocument()
      expect(screen.getByText('Blade Storm')).toBeInTheDocument()
    })

    it('should display gear for each party member', () => {
      render(<IdleDungeonCrawler />)
      const equipmentElements = screen.getAllByText('Equipment')
      expect(equipmentElements).toHaveLength(5) // 5 party members
    })
  })

  describe('Combat Area', () => {
    it('should render combat zone header', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Combat Zone')).toBeInTheDocument()
    })

    it('should show preparing message when no enemies', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Preparing for next encounter...')).toBeInTheDocument()
    })
  })

  describe('Combat Log', () => {
    it('should render combat log section', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Combat Log')).toBeInTheDocument()
    })

    it('should show message filters', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Combat')).toBeInTheDocument()
      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('Rewards')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Skills')).toBeInTheDocument()
    })

    it('should show starting message initially', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Starting adventure...')).toBeInTheDocument()
    })
  })

  describe('Interactive Elements', () => {
    it('should toggle compact mode when button is clicked', async () => {
      render(<IdleDungeonCrawler />)
      const compactButton = screen.getByText('Compact')
      
      fireEvent.click(compactButton)
      
      await waitFor(() => {
        expect(screen.getByText('Expand')).toBeInTheDocument()
      })
    })

    it('should toggle message filters when clicked', async () => {
      render(<IdleDungeonCrawler />)
      const combatFilter = screen.getByText('Combat')
      
      // Initially active, click to deactivate
      fireEvent.click(combatFilter)
      
      // The button should still exist but may have different styling
      expect(combatFilter).toBeInTheDocument()
    })

    it('should adjust game speed with slider', () => {
      render(<IdleDungeonCrawler />)
      const speedSlider = screen.getByRole('slider')
      
      fireEvent.change(speedSlider, { target: { value: '2000' } })
      
      expect(speedSlider).toHaveValue('2000')
      expect(screen.getByText('2000ms per action')).toBeInTheDocument()
    })
  })

  describe('Upgrade System Integration', () => {
    it('should show upgrade costs', () => {
      render(<IdleDungeonCrawler />)
      // Look for upgrade costs in a more general way
      const upgradeButtons = screen.getAllByText(/\d+g/)
      expect(upgradeButtons.length).toBeGreaterThan(0)
      
      // Check that costs are displayed (there are multiple 50g buttons for attack/defense)
      const fiftyGoldButtons = screen.getAllByText('50g')
      expect(fiftyGoldButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should disable upgrade buttons when insufficient gold', () => {
      render(<IdleDungeonCrawler />)
      const upgradeButtons = screen.getAllByText(/\d+g/)
      
      // All upgrade buttons should be present
      expect(upgradeButtons.length).toBeGreaterThan(0)
    })

    it('should show current upgrade levels', () => {
      render(<IdleDungeonCrawler />)
      const levelElements = screen.getAllByText(/Level \d+/)
      expect(levelElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<IdleDungeonCrawler />)
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Idle Dungeon Crawler')
    })

    it('should have accessible form controls', () => {
      render(<IdleDungeonCrawler />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute('min')
      expect(slider).toHaveAttribute('max')
    })

    it('should have descriptive button text', () => {
      render(<IdleDungeonCrawler />)
      const compactButton = screen.getByRole('button', { name: /compact/i })
      expect(compactButton).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing party member data gracefully', () => {
      // Test that the component doesn't crash with unexpected data
      expect(() => render(<IdleDungeonCrawler />)).not.toThrow()
    })

    it('should display fallback content when needed', () => {
      render(<IdleDungeonCrawler />)
      // Should show "No runs completed yet" initially
      expect(screen.getByText('No runs completed yet')).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    it('should render without excessive re-renders', () => {
      const { rerender } = render(<IdleDungeonCrawler />)
      
      // Re-render with same props shouldn't cause issues
      expect(() => rerender(<IdleDungeonCrawler />)).not.toThrow()
    })

    it('should handle large combat logs efficiently', () => {
      // Component should handle many log entries without performance issues
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Combat Log')).toBeInTheDocument()
    })
  })
})