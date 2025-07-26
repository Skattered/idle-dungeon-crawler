import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock global variables for tests
globalThis.__IS_PRODUCTION__ = false;
globalThis.__APP_VERSION__ = '0.1.7';


// Mock lucide-react icons with explicit exports
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  const MockIcon = ({ size, ...props }) => {
    return null; // Return null for all icon renders
  };
  
  return {
    ...actual,
    // Override all icons to return the mock
    TrendingUp: MockIcon,
    Star: MockIcon,
    Wrench: MockIcon,
    Scale: MockIcon,
    X: MockIcon,
    Bug: MockIcon,
    Sparkles: MockIcon,
    FileText: MockIcon,
    Shield: MockIcon,
    Heart: MockIcon,
    Sword: MockIcon,
    Target: MockIcon,
    Flame: MockIcon,
    Coins: MockIcon,
    Trophy: MockIcon,
    Skull: MockIcon,
    Minimize2: MockIcon,
    Maximize2: MockIcon,
    AlertCircle: MockIcon,
    ArrowRight: MockIcon,
    Check: MockIcon,
    ChevronDown: MockIcon,
    ChevronRight: MockIcon,
    ChevronLeft: MockIcon,
    ChevronUp: MockIcon,
    Circle: MockIcon,
    Download: MockIcon,
    Edit: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
    Home: MockIcon,
    Info: MockIcon,
    Menu: MockIcon,
    Plus: MockIcon,
    Search: MockIcon,
    Settings: MockIcon,
    Trash: MockIcon,
    Upload: MockIcon,
    User: MockIcon,
    Zap: MockIcon
  };
});