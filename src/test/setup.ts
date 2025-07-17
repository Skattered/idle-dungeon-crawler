import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock global variables for tests
globalThis.__IS_PRODUCTION__ = false;
globalThis.__APP_VERSION__ = '0.1.1';


// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = ({ size, ...props }) => {
    return null; // Return null for all icon renders
  };
  
  // Use a Proxy to handle any missing icons dynamically
  const iconProxy = new Proxy({}, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return MockIcon;
      }
      return undefined;
    }
  });
  
  return {
    // Explicitly define all known icons
    Download: MockIcon,
    Upload: MockIcon,
    Save: MockIcon,
    Plus: MockIcon,
    Minus: MockIcon,
    Shield: MockIcon,
    Sword: MockIcon,
    Heart: MockIcon,
    Star: MockIcon,
    Settings: MockIcon,
    X: MockIcon,
    Check: MockIcon,
    ChevronUp: MockIcon,
    ChevronDown: MockIcon,
    RotateCcw: MockIcon,
    Play: MockIcon,
    Pause: MockIcon,
    SkipForward: MockIcon,
    Volume2: MockIcon,
    VolumeX: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
    Target: MockIcon,
    Flame: MockIcon,
    HardHat: MockIcon,
    Shirt: MockIcon,
    Crown: MockIcon,
    Gem: MockIcon,
    Hand: MockIcon,
    Watch: MockIcon,
    Footprints: MockIcon,
    Users: MockIcon,
    Zap: MockIcon,
    ShoppingCart: MockIcon,
    Coins: MockIcon,
    Trophy: MockIcon,
    Skull: MockIcon,
    Minimize2: MockIcon,
    Maximize2: MockIcon,
    // Use proxy as fallback for any other icons
    ...iconProxy
  };
});