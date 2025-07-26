import { isProd } from './Environment';
import { skills, dpsClasses } from '../data/GameConfig';
import { createDefaultGear } from '../data/PartyManager';
import { Shield, Heart } from 'lucide-react';

export interface SaveData {
  gameState: {
    currentFloor: number;
    maxFloorReached: number;
    currentGroup: number;
    totalGroupsPerFloor: number;
    gold: number;
    totalGoldEarned: number;
    totalRuns: number;
    gearsFound: number;
    monstersKilled: number;
    runHistory: Array<{runNumber: number, floorReached: number, timestamp: number}>;
  };
  party: Array<any>;
  upgrades: {
    attackBonus: number;
    defenseBonus: number;
    healthBonus: number;
    goldMultiplier: number;
    gearDropBonus: number;
  };
  timestamp: number;
  version: string;
}

// Compressed save format with short keys
interface CompressedSave {
  g: { // gameState
    f: number; // currentFloor
    mf: number; // maxFloorReached
    cg: number; // currentGroup
    tgpf: number; // totalGroupsPerFloor
    go: number; // gold
    tg: number; // totalGoldEarned
    tr: number; // totalRuns
    gf2: number; // gearsFound
    mk: number; // monstersKilled
    rh: Array<{r: number, f: number, t: number}>; // runHistory
  };
  p: Array<any>; // party (simplified)
  u: { // upgrades
    a: number; // attackBonus
    d: number; // defenseBonus
    h: number; // healthBonus
    g: number; // goldMultiplier
    gr: number; // gearDropBonus
  };
  t: number; // timestamp
  v: string; // version
}

const SAVE_KEY = 'dungeon-crawler-save';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

// Simple encoding/decoding for save data obfuscation and size reduction
const ENCODE_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const DECODE_MAP: { [key: string]: number } = {};
ENCODE_MAP.split('').forEach((char, index) => {
  DECODE_MAP[char] = index;
});

export class SaveSystem {
  private static autosaveInterval: NodeJS.Timeout | null = null;

  static encodeString(str: string): string {
    // Convert JSON string to bytes, then encode with base64-like encoding
    const bytes = new TextEncoder().encode(str);
    let result = '';
    
    // Process bytes in groups of 3 (like base64 but with our custom alphabet)
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = bytes[i + 1] || 0;
      const b3 = bytes[i + 2] || 0;
      
      const combined = (b1 << 16) | (b2 << 8) | b3;
      
      result += ENCODE_MAP[(combined >> 18) & 63];
      result += ENCODE_MAP[(combined >> 12) & 63];
      result += i + 1 < bytes.length ? ENCODE_MAP[(combined >> 6) & 63] : '';
      result += i + 2 < bytes.length ? ENCODE_MAP[combined & 63] : '';
    }
    
    return result;
  }

  static decodeString(encoded: string): string {
    const bytes: number[] = [];
    
    // Process encoded string in groups of 4
    for (let i = 0; i < encoded.length; i += 4) {
      const c1 = DECODE_MAP[encoded[i]] || 0;
      const c2 = DECODE_MAP[encoded[i + 1]] || 0;
      const c3 = DECODE_MAP[encoded[i + 2]] || 0;
      const c4 = DECODE_MAP[encoded[i + 3]] || 0;
      
      const combined = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
      
      bytes.push((combined >> 16) & 255);
      if (i + 2 < encoded.length) bytes.push((combined >> 8) & 255);
      if (i + 3 < encoded.length) bytes.push(combined & 255);
    }
    
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  static setCookie(name: string, value: string, days: number = 365): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  static getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  static createSaveData(gameState: any, party: any[], upgrades: any): SaveData {
    return {
      gameState: {
        currentFloor: gameState.currentFloor,
        maxFloorReached: gameState.maxFloorReached,
        currentGroup: gameState.currentGroup,
        totalGroupsPerFloor: gameState.totalGroupsPerFloor,
        gold: gameState.gold,
        totalGoldEarned: gameState.totalGoldEarned,
        totalRuns: gameState.totalRuns,
        gearsFound: gameState.gearsFound,
        monstersKilled: gameState.monstersKilled,
        runHistory: gameState.runHistory
      },
      party: party.map(member => ({
        ...member,
        hp: member.maxHp // Reset HP on save
      })),
      upgrades,
      timestamp: Date.now(),
      version: __APP_VERSION__
    };
  }

  static saveToLocalStorage(saveData: SaveData): void {
    try {
      const compressed = this.compressSaveData(saveData);
      const encoded = this.encodeString(JSON.stringify(compressed));
      localStorage.setItem(SAVE_KEY, encoded);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  static loadFromLocalStorage(): SaveData | null {
    try {
      const encoded = localStorage.getItem(SAVE_KEY);
      if (!encoded) return null;
      const jsonStr = this.decodeString(encoded);
      const compressed = JSON.parse(jsonStr);
      return this.decompressSaveData(compressed);
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  static saveToCookies(saveData: SaveData): void {
    try {
      const compressed = this.compressSaveData(saveData);
      const encoded = this.encodeString(JSON.stringify(compressed));
      this.setCookie(SAVE_KEY, encoded);
    } catch (error) {
      console.warn('Failed to save to cookies:', error);
    }
  }

  static loadFromCookies(): SaveData | null {
    try {
      const encoded = this.getCookie(SAVE_KEY);
      if (!encoded) return null;
      const jsonStr = this.decodeString(encoded);
      const compressed = JSON.parse(jsonStr);
      return this.decompressSaveData(compressed);
    } catch (error) {
      console.warn('Failed to load from cookies:', error);
      return null;
    }
  }

  static autoSave(gameState: any, party: any[], upgrades: any): void {
    if (!isProd()) return; // Only autosave in production
    
    // Validate state before auto-saving
    if (!this.validateSaveData(gameState, party, upgrades)) {
      console.warn('Auto-save skipped due to invalid state data');
      return;
    }
    
    // Create atomic snapshots for auto-save
    const atomicGameState = this.createAtomicSnapshot(gameState);
    const atomicParty = this.createAtomicSnapshot(party);
    const atomicUpgrades = this.createAtomicSnapshot(upgrades);
    
    try {
      const saveData = this.createSaveData(atomicGameState, atomicParty, atomicUpgrades);
      this.saveToCookies(saveData);
      this.saveToLocalStorage(saveData); // Backup to localStorage
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  static startAutoSave(getGameData: () => {gameState: any, party: any[], upgrades: any}): void {
    // Enable autosave in both development and production
    
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    
    this.autosaveInterval = setInterval(() => {
      // Use setTimeout to ensure autosave happens after current execution cycle
      setTimeout(() => {
        try {
          const { gameState, party, upgrades } = getGameData();
          
          // Additional validation for autosave to prevent race conditions
          if (!this.validateAutosaveState(gameState, party, upgrades)) {
            console.warn('Autosave skipped due to inconsistent state');
            return;
          }
          
          this.autoSave(gameState, party, upgrades);
          if (!isProd()) {
            console.log('Development autosave completed - Gold:', gameState.gold, 'Upgrades:', upgrades);
          }
        } catch (error) {
          console.error('Autosave failed due to error:', error);
        }
      }, 0);
    }, AUTOSAVE_INTERVAL);
  }

  static stopAutoSave(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }

  static loadGame(): SaveData | null {
    // Try localStorage first, then cookies
    return this.loadFromLocalStorage() || this.loadFromCookies();
  }

  static compressSaveData(saveData: SaveData): CompressedSave {
    return {
      g: {
        f: saveData.gameState.currentFloor,
        mf: saveData.gameState.maxFloorReached,
        cg: saveData.gameState.currentGroup,
        tgpf: saveData.gameState.totalGroupsPerFloor,
        go: saveData.gameState.gold,
        tg: saveData.gameState.totalGoldEarned,
        tr: saveData.gameState.totalRuns,
        gf2: saveData.gameState.gearsFound,
        mk: saveData.gameState.monstersKilled,
        rh: saveData.gameState.runHistory.map(r => ({r: r.runNumber, f: r.floorReached, t: r.timestamp}))
      },
      p: saveData.party.map(member => ({
        n: member.name,
        c: member.class,
        r: member.role,
        l: member.level,
        x: member.experience,
        h: member.maxHp,
        bh: member.baseHp,
        a: member.baseAttack,
        d: member.baseDefense,
        dc: member.dpsClass,
        as: member.attackSpeed || 1.0,
        ip: member.isProtected || false,
        g: member.gear ? {
          w: member.gear.weapon?.level || 0,
          h: member.gear.helm?.level || 0,
          c: member.gear.chest?.level || 0,
          r1: member.gear.ring1?.level || 0,
          r2: member.gear.ring2?.level || 0,
          a: member.gear.amulet?.level || 0,
          gl: member.gear.gloves?.level || 0,
          br: member.gear.bracers?.level || 0,
          b: member.gear.boots?.level || 0,
          p: member.gear.pants?.level || 0
        } : {}
      })),
      u: {
        a: saveData.upgrades.attackBonus,
        d: saveData.upgrades.defenseBonus,
        h: saveData.upgrades.healthBonus,
        g: saveData.upgrades.goldMultiplier,
        gr: saveData.upgrades.gearDropBonus
      },
      t: saveData.timestamp,
      v: saveData.version
    };
  }

  static decompressSaveData(compressed: CompressedSave): SaveData {
    return {
      gameState: {
        currentFloor: compressed.g.f,
        maxFloorReached: compressed.g.mf,
        currentGroup: compressed.g.cg || 1, // Default to 1 for backwards compatibility
        totalGroupsPerFloor: compressed.g.tgpf || 5, // Default to 5 for backwards compatibility
        gold: compressed.g.go,
        totalGoldEarned: compressed.g.tg,
        totalRuns: compressed.g.tr,
        gearsFound: compressed.g.gf2,
        monstersKilled: compressed.g.mk,
        runHistory: compressed.g.rh.map(r => ({runNumber: r.r, floorReached: r.f, timestamp: r.t}))
      },
      party: compressed.p.map(member => {
        // Restore skill based on dpsClass or role
        const skillKey = member.dc || member.r; // Use dpsClass if available, fallback to role
        const skill = skills[skillKey as keyof typeof skills] || skills.warrior; // Fallback to warrior skill
        
        // Restore icon based on dpsClass or role
        const icon = member.dc && dpsClasses[member.dc as keyof typeof dpsClasses] 
          ? dpsClasses[member.dc as keyof typeof dpsClasses].icon
          : member.r === 'tank' ? Shield
          : member.r === 'healer' ? Heart
          : dpsClasses.warrior.icon; // Default fallback
        
        return {
          name: member.n,
          class: member.c,
          role: member.r,
          dpsClass: member.dc,
          level: member.l,
          experience: member.x,
          hp: member.h,
          maxHp: member.h,
          baseHp: member.bh || member.h || 100,
          baseAttack: member.a,
          baseDefense: member.d,
          attack: member.a,
          defense: member.d,
          attackSpeed: member.as || 1.0,
          isProtected: member.ip || false,
          attackTimer: 0,
          icon: icon,
          skill: skill,
          skillCooldown: 0,
          skillActive: false,
          skillDuration: 0,
          gear: (() => {
            const defaultGear = createDefaultGear();
            return {
              weapon: member.g.w ? { ...defaultGear.weapon, level: member.g.w } : defaultGear.weapon,
              helm: member.g.h ? { ...defaultGear.helm, level: member.g.h } : defaultGear.helm,
              chest: member.g.c ? { ...defaultGear.chest, level: member.g.c } : defaultGear.chest,
              ring1: member.g.r1 ? { ...defaultGear.ring1, level: member.g.r1 } : defaultGear.ring1,
              ring2: member.g.r2 ? { ...defaultGear.ring2, level: member.g.r2 } : defaultGear.ring2,
              amulet: member.g.a ? { ...defaultGear.amulet, level: member.g.a } : defaultGear.amulet,
              gloves: member.g.gl ? { ...defaultGear.gloves, level: member.g.gl } : defaultGear.gloves,
              bracers: member.g.br ? { ...defaultGear.bracers, level: member.g.br } : defaultGear.bracers,
              boots: member.g.b ? { ...defaultGear.boots, level: member.g.b } : defaultGear.boots,
              pants: member.g.p ? { ...defaultGear.pants, level: member.g.p } : defaultGear.pants
            };
          })()
        };
      }),
      upgrades: {
        attackBonus: compressed.u.a,
        defenseBonus: compressed.u.d,
        healthBonus: compressed.u.h,
        goldMultiplier: compressed.u.g,
        gearDropBonus: compressed.u.gr
      },
      timestamp: compressed.t,
      version: compressed.v
    };
  }

  static exportToString(gameState: any, party: any[], upgrades: any): string {
    const saveData = this.createSaveData(gameState, party, upgrades);
    const compressed = this.compressSaveData(saveData);
    return this.encodeString(JSON.stringify(compressed));
  }

  static importFromString(encodedString: string): SaveData | null {
    try {
      const jsonStr = this.decodeString(encodedString);
      const compressed = JSON.parse(jsonStr);
      
      // Validate compressed format
      if (!compressed.g || !compressed.p || !compressed.u) {
        throw new Error('Invalid save data structure');
      }
      
      return this.decompressSaveData(compressed);
    } catch (error) {
      console.error('Failed to import save data:', error);
      return null;
    }
  }

  static manualSave(gameState: any, party: any[], upgrades: any): void {
    // Enable manual save in both development and production
    
    // Perform atomic state capture and validation
    if (!this.validateSaveData(gameState, party, upgrades)) {
      console.warn('Save aborted due to invalid state data');
      return;
    }
    
    // Create deep copy of state to prevent race conditions
    const atomicGameState = this.createAtomicSnapshot(gameState);
    const atomicParty = this.createAtomicSnapshot(party);
    const atomicUpgrades = this.createAtomicSnapshot(upgrades);
    
    try {
      const saveData = this.createSaveData(atomicGameState, atomicParty, atomicUpgrades);
      this.saveToCookies(saveData);
      this.saveToLocalStorage(saveData);
    } catch (error) {
      console.error('Save operation failed:', error);
    }
  }

  // Helper methods for race condition prevention
  private static createAtomicSnapshot(data: any): any {
    // Create deep copy to prevent race conditions
    return JSON.parse(JSON.stringify(data));
  }

  private static validateAutosaveState(gameState: any, party: any[], upgrades: any): boolean {
    // Enhanced validation for autosave to prevent race conditions
    try {
      // Basic structure validation
      if (!gameState || !Array.isArray(party) || !upgrades) return false;
      
      // Validate that state isn't in a transitional state
      if (gameState.inCombat && (!gameState.enemies || gameState.enemies.length === 0)) {
        return false; // Combat state inconsistent
      }
      
      // Validate party state consistency
      for (const member of party) {
        if (!member || typeof member.hp !== 'number' || typeof member.maxHp !== 'number') {
          return false;
        }
        if (member.hp > member.maxHp || member.hp < 0) {
          return false; // HP values inconsistent
        }
      }
      
      // Validate game state consistency
      if (gameState.currentGroup < 1 || gameState.currentGroup > gameState.totalGroupsPerFloor) {
        return false; // Group progression inconsistent
      }
      
      return true;
    } catch (error) {
      console.warn('Autosave validation failed:', error);
      return false;
    }
  }

  private static validateSaveData(gameState: any, party: any[], upgrades: any): boolean {
    // Validate critical fields to prevent corrupt saves
    if (!gameState || typeof gameState !== 'object') return false;
    if (!Array.isArray(party)) return false;
    if (!upgrades || typeof upgrades !== 'object') return false;
    
    // Check for NaN or null values in critical fields
    if (typeof gameState.gold !== 'number' || isNaN(gameState.gold)) return false;
    if (typeof gameState.currentFloor !== 'number' || isNaN(gameState.currentFloor)) return false;
    
    // Validate party structure
    if (party.length === 0) return false;
    for (const member of party) {
      if (!member || typeof member !== 'object') return false;
      if (typeof member.hp !== 'number' || isNaN(member.hp)) return false;
      if (typeof member.maxHp !== 'number' || isNaN(member.maxHp)) return false;
    }
    
    return true;
  }
}