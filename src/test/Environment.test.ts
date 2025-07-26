import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the global variables
declare global {
  var __IS_PRODUCTION__: boolean;
  var __APP_VERSION__: string;
}

describe('Environment utilities', () => {
  beforeEach(async () => {
    // Reset globals and modules before each test
    vi.resetAllMocks();
    vi.resetModules();
  });

  describe('Environment object', () => {
    test('should expose production flag correctly', async () => {
      // Mock production environment
      globalThis.__IS_PRODUCTION__ = true;
      globalThis.__APP_VERSION__ = '1.0.0';
      
      // Import fresh module to get new values
      const { Environment } = await import('../utils/Environment');
      
      expect(Environment.isProduction).toBe(true);
      expect(Environment.isDevelopment).toBe(false);
      expect(Environment.version).toBe('1.0.0');
    });

    test('should expose development flag correctly', async () => {
      // Mock development environment
      globalThis.__IS_PRODUCTION__ = false;
      globalThis.__APP_VERSION__ = '0.1.1';
      
      // Import fresh module to get new values
      const { Environment } = await import('../utils/Environment');
      
      expect(Environment.isProduction).toBe(false);
      expect(Environment.isDevelopment).toBe(true);
      expect(Environment.version).toBe('0.1.1');
    });
  });

  describe('isProd helper', () => {
    test('should return true in production', async () => {
      globalThis.__IS_PRODUCTION__ = true;
      
      const { isProd } = await import('../utils/Environment');
      expect(isProd()).toBe(true);
    });

    test('should return false in development', async () => {
      globalThis.__IS_PRODUCTION__ = false;
      
      const { isProd } = await import('../utils/Environment');
      expect(isProd()).toBe(false);
    });
  });

  describe('isDev helper', () => {
    test('should return false in production', async () => {
      globalThis.__IS_PRODUCTION__ = true;
      
      const { isDev } = await import('../utils/Environment');
      expect(isDev()).toBe(false);
    });

    test('should return true in development', async () => {
      globalThis.__IS_PRODUCTION__ = false;
      
      const { isDev } = await import('../utils/Environment');
      expect(isDev()).toBe(true);
    });
  });
});