import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import IdleDungeonCrawler from '../IdleDungeonCrawler'

// Mock Lucide React icons to avoid complex icon rendering
vi.mock('lucide-react', () => {
  const MockIcon = ({ 'data-testid': testId, ...props }: any) => 
    <div data-testid={testId || 'mock-icon'} {...props}>{String(props.children || 'MockIcon')}</div>
  
  return {
    Sword: MockIcon,
    Shield: MockIcon,
    Heart: MockIcon,
    Zap: MockIcon,
    Trophy: MockIcon,
    Skull: MockIcon,
    Shirt: MockIcon,
    Crown: MockIcon,
    Gem: MockIcon,
    HardHat: MockIcon,
    Users: MockIcon,
    Wrench: MockIcon,
    Hand: MockIcon,
    Watch: MockIcon,
    Footprints: MockIcon,
    Coins: MockIcon,
    ShoppingCart: MockIcon,
    Target: MockIcon,
    Flame: MockIcon,
    Wind: MockIcon,
    Minimize2: MockIcon,
    Maximize2: MockIcon
  }
})

describe('IdleDungeonCrawler Component - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<IdleDungeonCrawler />)).not.toThrow()
    })

    it('should render the main title', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Idle Dungeon Crawler')).toBeInTheDocument()
    })

    it('should render party section', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Party')).toBeInTheDocument()
    })

    it('should render combat zone', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Combat Zone')).toBeInTheDocument()
    })

    it('should render upgrades section', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Upgrades')).toBeInTheDocument()
    })

    it('should render combat log', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Combat Log')).toBeInTheDocument()
    })
  })

  describe('Party Members', () => {
    it('should display all party member names', () => {
      render(<IdleDungeonCrawler />)
      
      const expectedMembers = ['Tank', 'Healer', 'Warrior', 'Rogue', 'Mage']
      expectedMembers.forEach(memberName => {
        expect(screen.getByText(memberName)).toBeInTheDocument()
      })
    })

    it('should display health information', () => {
      render(<IdleDungeonCrawler />)
      const healthLabels = screen.getAllByText('Health')
      expect(healthLabels.length).toBeGreaterThan(0)
    })

    it('should display attack and defense stats', () => {
      render(<IdleDungeonCrawler />)
      const attackLabels = screen.getAllByText('ATK')
      const defenseLabels = screen.getAllByText('DEF')
      
      expect(attackLabels.length).toBeGreaterThan(0)
      expect(defenseLabels.length).toBeGreaterThan(0)
    })
  })

  describe('Skills Display', () => {
    it('should show skill names', () => {
      render(<IdleDungeonCrawler />)
      
      const expectedSkills = ['Shield Wall', 'Healing Light', 'Blade Storm', 'Shadow Strike', 'Arcane Blast']
      expectedSkills.forEach(skillName => {
        expect(screen.getByText(skillName)).toBeInTheDocument()
      })
    })

    it('should show skill status indicators', () => {
      render(<IdleDungeonCrawler />)
      const readyStatuses = screen.getAllByText('READY')
      expect(readyStatuses.length).toBeGreaterThan(0)
    })
  })

  describe('Upgrade System', () => {
    it('should display upgrade names', () => {
      render(<IdleDungeonCrawler />)
      
      const expectedUpgrades = ['Attack Training', 'Defense Training', 'Health Training', 'Treasure Hunter', 'Lucky Find']
      expectedUpgrades.forEach(upgradeName => {
        expect(screen.getByText(upgradeName)).toBeInTheDocument()
      })
    })

    it('should show upgrade levels', () => {
      render(<IdleDungeonCrawler />)
      const levelTexts = screen.getAllByText(/Level \d+/)
      expect(levelTexts.length).toBeGreaterThan(0)
    })

    it('should display gold costs', () => {
      render(<IdleDungeonCrawler />)
      const goldButtons = screen.getAllByText(/\d+g/)
      expect(goldButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Game Controls', () => {
    it('should have a game speed slider', () => {
      render(<IdleDungeonCrawler />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute('min')
      expect(slider).toHaveAttribute('max')
    })

    it('should show compact mode toggle', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Compact')).toBeInTheDocument()
    })

    it('should show message filter controls', () => {
      render(<IdleDungeonCrawler />)
      
      const filterNames = ['Combat', 'Progress', 'Rewards', 'Status', 'Skills']
      filterNames.forEach(filterName => {
        expect(screen.getByText(filterName)).toBeInTheDocument()
      })
    })
  })

  describe('Initial State', () => {
    it('should show starting adventure message', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Starting adventure...')).toBeInTheDocument()
    })

    it('should show preparation message when no enemies', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('Preparing for next encounter...')).toBeInTheDocument()
    })

    it('should show no runs completed initially', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText('No runs completed yet')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have main heading', () => {
      render(<IdleDungeonCrawler />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('should have interactive elements', () => {
      render(<IdleDungeonCrawler />)
      
      // Should have buttons
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Should have slider
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should render main stats display', () => {
      render(<IdleDungeonCrawler />)
      
      expect(screen.getByText('Gold')).toBeInTheDocument()
      expect(screen.getByText('Best Floor')).toBeInTheDocument()
      expect(screen.getByText('Total Runs')).toBeInTheDocument()
    })

    it('should render additional stats', () => {
      render(<IdleDungeonCrawler />)
      
      expect(screen.getByText(/Gear Found:/)).toBeInTheDocument()
      expect(screen.getByText(/Monsters Killed:/)).toBeInTheDocument()
      expect(screen.getByText(/Total Gold Earned:/)).toBeInTheDocument()
    })

    it('should show floor and group information', () => {
      render(<IdleDungeonCrawler />)
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Floor 1, Group 1/4'
      })).toBeInTheDocument()
    })
  })
})