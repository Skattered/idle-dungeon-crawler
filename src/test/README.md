# Test Suite for Idle Dungeon Crawler

This directory contains comprehensive unit tests for the Idle Dungeon Crawler game.

## Test Files

### Core Game Logic Tests

1. **gameLogic.test.ts** - Tests core game mechanics
   - Critical hit calculation
   - Gear creation and stats
   - Member stats calculation  
   - Enemy group generation

2. **massResurrection.test.ts** - Tests the mass resurrection system
   - Mass resurrection trigger conditions
   - Timer progression and completion
   - Enemy attack prevention during resurrection
   - Healer protection mechanics

3. **partyManagement.test.ts** - Tests party management systems
   - Party initialization and stats
   - Health management and healing
   - Attack speed variations
   - Party member targeting

4. **upgradeSystem.test.ts** - Tests the upgrade system
   - Cost calculation with exponential scaling
   - Purchase validation and effects
   - Stat bonus applications
   - Upgrade progression tracking

5. **gearSystem.test.ts** - Tests the gear system
   - Gear creation and structure
   - Stats calculation with level multipliers
   - Gear upgrading mechanics
   - Drop chance calculations
   - Integration with character stats

6. **skillsAndClasses.test.ts** - Tests skills and DPS classes
   - DPS class definitions and balance
   - Skill definitions and effects
   - Skill processing logic
   - Cooldown management
   - Balance analysis between classes

### Component Tests

7. **IdleDungeonCrawler.simple.test.tsx** - Simple React component tests
   - Basic rendering without crashes
   - UI element presence
   - Accessibility features

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests (excluding React components)
npm test run -- src/test/gameLogic.test.ts src/test/massResurrection.test.ts src/test/partyManagement.test.ts src/test/upgradeSystem.test.ts src/test/gearSystem.test.ts src/test/skillsAndClasses.test.ts

# Run tests in watch mode for development
npm test
```

## Test Coverage

The test suite covers:

- ✅ Critical hit system
- ✅ Mass resurrection mechanics 
- ✅ Enemy attack prevention during resurrection
- ✅ Party management and stats
- ✅ Upgrade system with exponential costs
- ✅ Gear system and drop mechanics
- ✅ Skills and DPS class balance
- ✅ Basic React component rendering

## Test Statistics

- **88 unit tests** covering game logic
- **6 test files** for different game systems
- **100% pass rate** for unit tests
- Uses **Vitest** testing framework
- Uses **@testing-library/react** for component testing

## Key Test Features

- **Mocked dependencies** for isolated testing
- **Floating point precision** handling with `toBeCloseTo()`
- **Comprehensive edge cases** including boundary conditions
- **Balance validation** for game mechanics
- **Error handling** tests for robustness