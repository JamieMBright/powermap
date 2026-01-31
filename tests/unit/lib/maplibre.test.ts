import { describe, it, expect } from 'vitest';
import {
  MAP_CONFIG,
  DRIVER_COLORS,
  ASSET_COLORS,
  BOUNDARY_STYLES,
} from '@/lib/maplibre';

describe('maplibre configuration', () => {
  describe('MAP_CONFIG', () => {
    it('should have a valid style URL', () => {
      expect(MAP_CONFIG.style).toBe(
        'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      );
      expect(MAP_CONFIG.style).toMatch(/^https?:\/\//);
    });

    it('should have center coordinates for London', () => {
      const [lng, lat] = MAP_CONFIG.center;

      // London is approximately at longitude -0.1 and latitude 51.5
      expect(lng).toBeCloseTo(-0.1, 1);
      expect(lat).toBeCloseTo(51.5, 1);
    });

    it('should have valid zoom levels', () => {
      expect(MAP_CONFIG.zoom).toBeGreaterThanOrEqual(MAP_CONFIG.minZoom);
      expect(MAP_CONFIG.zoom).toBeLessThanOrEqual(MAP_CONFIG.maxZoom);
      expect(MAP_CONFIG.minZoom).toBeLessThan(MAP_CONFIG.maxZoom);
    });

    it('should have default zoom level', () => {
      expect(MAP_CONFIG.zoom).toBe(7);
    });

    it('should have min and max zoom levels', () => {
      expect(MAP_CONFIG.minZoom).toBe(5);
      expect(MAP_CONFIG.maxZoom).toBe(18);
    });

    it('should have valid bounds for UKPN coverage area', () => {
      const [southwest, northeast] = MAP_CONFIG.bounds as [[number, number], [number, number]];
      const [swLng, swLat] = southwest;
      const [neLng, neLat] = northeast;

      // Southwest should be less than northeast
      expect(swLng).toBeLessThan(neLng);
      expect(swLat).toBeLessThan(neLat);

      // Bounds should be within UK area
      expect(swLng).toBeGreaterThan(-10);
      expect(swLng).toBeLessThan(5);
      expect(neLng).toBeGreaterThan(-10);
      expect(neLng).toBeLessThan(5);
      expect(swLat).toBeGreaterThan(49);
      expect(swLat).toBeLessThan(55);
      expect(neLat).toBeGreaterThan(49);
      expect(neLat).toBeLessThan(55);
    });
  });

  describe('DRIVER_COLORS', () => {
    it('should have colors for all investment drivers', () => {
      const expectedDrivers = [
        'asset_replacement',
        'load_reinforcement',
        'proactive_investment',
        'fault_level',
        'reverse_power_flow',
        'connections',
      ];

      expectedDrivers.forEach((driver) => {
        expect(DRIVER_COLORS).toHaveProperty(driver);
      });
    });

    it('should have valid hex color values', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      Object.values(DRIVER_COLORS).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it('should have unique colors for each driver', () => {
      const colors = Object.values(DRIVER_COLORS);
      const uniqueColors = new Set(colors);

      expect(uniqueColors.size).toBe(colors.length);
    });

    it('should have specific expected colors', () => {
      expect(DRIVER_COLORS.asset_replacement).toBe('#3b82f6'); // Blue
      expect(DRIVER_COLORS.load_reinforcement).toBe('#f59e0b'); // Amber
      expect(DRIVER_COLORS.proactive_investment).toBe('#10b981'); // Emerald
      expect(DRIVER_COLORS.fault_level).toBe('#ef4444'); // Red
      expect(DRIVER_COLORS.reverse_power_flow).toBe('#8b5cf6'); // Violet
      expect(DRIVER_COLORS.connections).toBe('#06b6d4'); // Cyan
    });
  });

  describe('ASSET_COLORS', () => {
    it('should have colors for all asset types', () => {
      const expectedAssets = [
        'substation',
        'transformer',
        'cable',
        'overhead_line',
        'switchgear',
      ];

      expectedAssets.forEach((asset) => {
        expect(ASSET_COLORS).toHaveProperty(asset);
      });
    });

    it('should have valid hex color values', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      Object.values(ASSET_COLORS).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it('should have unique colors for each asset type', () => {
      const colors = Object.values(ASSET_COLORS);
      const uniqueColors = new Set(colors);

      expect(uniqueColors.size).toBe(colors.length);
    });

    it('should have specific expected colors', () => {
      expect(ASSET_COLORS.substation).toBe('#dc2626');
      expect(ASSET_COLORS.transformer).toBe('#ea580c');
      expect(ASSET_COLORS.cable).toBe('#65a30d');
      expect(ASSET_COLORS.overhead_line).toBe('#0891b2');
      expect(ASSET_COLORS.switchgear).toBe('#7c3aed');
    });
  });

  describe('BOUNDARY_STYLES', () => {
    it('should have line style properties', () => {
      expect(BOUNDARY_STYLES.line).toBeDefined();
      expect(BOUNDARY_STYLES.line).toHaveProperty('color');
      expect(BOUNDARY_STYLES.line).toHaveProperty('width');
      expect(BOUNDARY_STYLES.line).toHaveProperty('opacity');
    });

    it('should have fill style properties', () => {
      expect(BOUNDARY_STYLES.fill).toBeDefined();
      expect(BOUNDARY_STYLES.fill).toHaveProperty('color');
      expect(BOUNDARY_STYLES.fill).toHaveProperty('opacity');
    });

    it('should have highlight style properties', () => {
      expect(BOUNDARY_STYLES.highlight).toBeDefined();
      expect(BOUNDARY_STYLES.highlight).toHaveProperty('fillOpacity');
      expect(BOUNDARY_STYLES.highlight).toHaveProperty('lineWidth');
    });

    it('should have valid line style values', () => {
      expect(BOUNDARY_STYLES.line.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(BOUNDARY_STYLES.line.width).toBeGreaterThan(0);
      expect(BOUNDARY_STYLES.line.opacity).toBeGreaterThanOrEqual(0);
      expect(BOUNDARY_STYLES.line.opacity).toBeLessThanOrEqual(1);
    });

    it('should have valid fill style values', () => {
      expect(BOUNDARY_STYLES.fill.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(BOUNDARY_STYLES.fill.opacity).toBeGreaterThanOrEqual(0);
      expect(BOUNDARY_STYLES.fill.opacity).toBeLessThanOrEqual(1);
    });

    it('should have valid highlight style values', () => {
      expect(BOUNDARY_STYLES.highlight.fillOpacity).toBeGreaterThanOrEqual(0);
      expect(BOUNDARY_STYLES.highlight.fillOpacity).toBeLessThanOrEqual(1);
      expect(BOUNDARY_STYLES.highlight.lineWidth).toBeGreaterThan(0);
    });

    it('should have same color for line and fill', () => {
      expect(BOUNDARY_STYLES.line.color).toBe(BOUNDARY_STYLES.fill.color);
    });

    it('should have higher opacity for highlight than fill', () => {
      expect(BOUNDARY_STYLES.highlight.fillOpacity).toBeGreaterThan(
        BOUNDARY_STYLES.fill.opacity
      );
    });
  });
});
