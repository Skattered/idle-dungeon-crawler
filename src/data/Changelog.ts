export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'balance';
    description: string;
  }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.1.7',
    date: '2025-01-26',
    changes: [
      {
        type: 'fix',
        description: 'Fixed enemy attack bars not displaying progress - now properly shows when enemies will attack'
      },
      {
        type: 'fix', 
        description: 'Fixed healer protection in development kill button - now properly activates Divine Protection'
      }
    ]
  },
  {
    version: '0.1.6',
    date: '2025-01-26',
    changes: [
      {
        type: 'fix',
        description: 'Fixed gold and upgrades resetting during party wipes - save system now works properly in development mode'
      },
      {
        type: 'fix',
        description: 'Fixed all unit test failures by adding missing icon mocks and updating test configurations'
      },
      {
        type: 'improvement',
        description: 'Improved mobile responsive design for GameHeader component with better viewport compatibility'
      }
    ]
  },
  {
    version: '0.1.5',
    date: '2025-01-25',
    changes: [
      {
        type: 'feature',
        description: 'Added changelog system - shows what\'s new when you load a new version'
      },
      {
        type: 'fix',
        description: 'Fixed drop system - gold, gear, and monster kill counters now work properly'
      },
      {
        type: 'fix', 
        description: 'Restored mass resurrection mechanic - healer now casts Divine Protection when party wipes'
      },
      {
        type: 'fix',
        description: 'Fixed party member class names showing as "UNKNOWN"'
      },
      {
        type: 'improvement',
        description: 'Added proper reward scaling based on floor level'
      }
    ]
  },
  {
    version: '0.1.4',
    date: '2025-01-17',
    changes: [
      {
        type: 'fix',
        description: 'Fixed React setState during render errors causing game crashes'
      },
      {
        type: 'fix',
        description: 'Resolved race conditions in combat progression system'
      },
      {
        type: 'fix',
        description: 'Fixed game getting stuck after killing 2nd enemy'
      },
      {
        type: 'improvement',
        description: 'Improved combat state management with centralized store'
      },
      {
        type: 'improvement',
        description: 'Enhanced build system with proper version display'
      }
    ]
  }
];

export const getLatestVersion = (): ChangelogEntry => {
  return changelog[0];
};

export const getChangesForVersion = (version: string): ChangelogEntry | undefined => {
  return changelog.find(entry => entry.version === version);
};