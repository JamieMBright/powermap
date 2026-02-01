import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ICON_MANIFEST,
  getAvailableIcons,
  hasIcon,
  clearOIMSymbolsCache,
} from '@/lib/oim-symbols';

describe('OIM Symbols Module', () => {
  beforeEach(() => {
    clearOIMSymbolsCache();
  });

  afterEach(() => {
    clearOIMSymbolsCache();
  });

  describe('ICON_MANIFEST', () => {
    it('should contain wind turbine icon', () => {
      expect(ICON_MANIFEST['power_wind']).toBe('/icons/oim/power_wind.svg');
    });

    it('should contain solar generator icon', () => {
      expect(ICON_MANIFEST['power_generator_solar']).toBe('/icons/oim/power_generator_solar.svg');
    });

    it('should contain transformer icon', () => {
      expect(ICON_MANIFEST['power_transformer']).toBe('/icons/oim/power_transformer.svg');
    });

    it('should contain tower icon', () => {
      expect(ICON_MANIFEST['power_tower']).toBe('/icons/oim/power_tower.svg');
    });

    it('should contain pole icon', () => {
      expect(ICON_MANIFEST['power_pole']).toBe('/icons/oim/power_pole.svg');
    });

    it('should contain switch icon', () => {
      expect(ICON_MANIFEST['power_switch']).toBe('/icons/oim/power_switch.svg');
    });

    it('should contain compensator icon', () => {
      expect(ICON_MANIFEST['power_compensator']).toBe('/icons/oim/power_compensator.svg');
    });

    it('should contain generic generator icon', () => {
      expect(ICON_MANIFEST['power_generator']).toBe('/icons/oim/power_generator.svg');
    });

    it('should contain power plant icon', () => {
      expect(ICON_MANIFEST['power_plant']).toBe('/icons/oim/power_plant.svg');
    });

    it('should contain substation icon', () => {
      expect(ICON_MANIFEST['power_substation']).toBe('/icons/oim/power_substation.svg');
    });

    it('should contain converter icon', () => {
      expect(ICON_MANIFEST['converter']).toBe('/icons/oim/converter.svg');
    });
  });

  describe('getAvailableIcons', () => {
    it('should return array of icon IDs', () => {
      const icons = getAvailableIcons();
      expect(Array.isArray(icons)).toBe(true);
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should include all expected icons', () => {
      const icons = getAvailableIcons();
      expect(icons).toContain('power_wind');
      expect(icons).toContain('power_generator_solar');
      expect(icons).toContain('power_transformer');
      expect(icons).toContain('power_tower');
      expect(icons).toContain('power_pole');
      expect(icons).toContain('power_switch');
      expect(icons).toContain('power_compensator');
    });
  });

  describe('hasIcon', () => {
    it('should return true for existing icons', () => {
      expect(hasIcon('power_wind')).toBe(true);
      expect(hasIcon('power_transformer')).toBe(true);
      expect(hasIcon('power_tower')).toBe(true);
    });

    it('should return false for non-existent icons', () => {
      expect(hasIcon('nonexistent_icon')).toBe(false);
      expect(hasIcon('random_name')).toBe(false);
    });
  });

  describe('clearOIMSymbolsCache', () => {
    it('should not throw when called', () => {
      expect(() => clearOIMSymbolsCache()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      clearOIMSymbolsCache();
      clearOIMSymbolsCache();
      clearOIMSymbolsCache();
      // No error means success
      expect(true).toBe(true);
    });
  });
});
