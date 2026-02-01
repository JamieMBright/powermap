import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OIM_SOURCE,
  OIM_LAYER_IDS,
  addOIMToMap,
  setOIMVisibility,
  isOIMVisible,
  removeOIMFromMap,
  checkOIMSourceLoaded,
} from '@/lib/oim';
import type { Map as MaplibreMap } from 'maplibre-gl';

// Mock MapLibre Map
function createMockMap(): MaplibreMap {
  const sources = new Map<string, unknown>();
  const layers = new Map<string, unknown>();
  const layoutProperties = new Map<string, Map<string, unknown>>();

  return {
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, source: unknown) => {
      sources.set(id, source);
    }),
    getLayer: vi.fn((id: string) => layers.get(id)),
    addLayer: vi.fn((layer: { id: string }) => {
      layers.set(layer.id, layer);
    }),
    setLayoutProperty: vi.fn((layerId: string, prop: string, value: unknown) => {
      if (!layoutProperties.has(layerId)) {
        layoutProperties.set(layerId, new Map());
      }
      layoutProperties.get(layerId)!.set(prop, value);
    }),
    getLayoutProperty: vi.fn((layerId: string, prop: string) => {
      return layoutProperties.get(layerId)?.get(prop);
    }),
    on: vi.fn(),
    off: vi.fn(),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id);
    }),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
  } as unknown as MaplibreMap;
}

describe('OIM (Open Infrastructure Map) Module', () => {
  describe('OIM_SOURCE', () => {
    it('should be a vector tile source', () => {
      expect(OIM_SOURCE.type).toBe('vector');
    });

    it('should have correct tile URL', () => {
      expect(OIM_SOURCE.tiles).toContain(
        'https://openinframap.org/map/power/{z}/{x}/{y}.pbf'
      );
    });

    it('should have valid zoom range', () => {
      expect(OIM_SOURCE.minzoom).toBe(2);
      expect(OIM_SOURCE.maxzoom).toBe(17);
      expect(OIM_SOURCE.minzoom).toBeLessThan(OIM_SOURCE.maxzoom as number);
    });

    it('should include attribution', () => {
      expect(OIM_SOURCE.attribution).toContain('Open Infrastructure Map');
      expect(OIM_SOURCE.attribution).toContain('OpenStreetMap');
    });
  });

  describe('OIM_LAYER_IDS', () => {
    it('should include power line layers', () => {
      expect(OIM_LAYER_IDS).toContain('power_line');
      expect(OIM_LAYER_IDS).toContain('power_line_underground');
    });

    it('should include substation layers', () => {
      expect(OIM_LAYER_IDS).toContain('power_substation');
      expect(OIM_LAYER_IDS).toContain('power_substation_point');
      expect(OIM_LAYER_IDS).toContain('power_substation_label');
    });

    it('should include generator layers', () => {
      expect(OIM_LAYER_IDS).toContain('power_wind_turbine');
      expect(OIM_LAYER_IDS).toContain('power_generator_solar');
      expect(OIM_LAYER_IDS).toContain('power_generator');
    });

    it('should include power plant layers', () => {
      expect(OIM_LAYER_IDS).toContain('power_plant');
      expect(OIM_LAYER_IDS).toContain('power_plant_label');
    });

    it('should include transformer layer', () => {
      expect(OIM_LAYER_IDS).toContain('power_transformer');
    });
  });

  describe('addOIMToMap', () => {
    let mockMap: MaplibreMap;

    beforeEach(() => {
      mockMap = createMockMap();
    });

    it('should add source if not already present', () => {
      addOIMToMap(mockMap);

      expect(mockMap.addSource).toHaveBeenCalledWith('oim-power', OIM_SOURCE);
    });

    it('should not add source if already present', () => {
      vi.mocked(mockMap.getSource).mockReturnValueOnce({} as never);

      addOIMToMap(mockMap);

      expect(mockMap.addSource).not.toHaveBeenCalled();
    });

    it('should add all OIM layers', () => {
      addOIMToMap(mockMap);

      // Should add all layers
      expect(mockMap.addLayer).toHaveBeenCalledTimes(OIM_LAYER_IDS.length);
    });

    it('should not add layers if already present', () => {
      // Mock all layers as existing
      vi.mocked(mockMap.getLayer).mockReturnValue({} as never);

      addOIMToMap(mockMap);

      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });
  });

  describe('setOIMVisibility', () => {
    let mockMap: MaplibreMap;

    beforeEach(() => {
      mockMap = createMockMap();
      // Simulate layers exist
      vi.mocked(mockMap.getLayer).mockReturnValue({} as never);
    });

    it('should set visibility to visible for all OIM layers', () => {
      setOIMVisibility(mockMap, true);

      // Should be called for each layer
      expect(mockMap.setLayoutProperty).toHaveBeenCalledTimes(OIM_LAYER_IDS.length);

      // Check a specific call
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'power_line',
        'visibility',
        'visible'
      );
    });

    it('should set visibility to none for all OIM layers', () => {
      setOIMVisibility(mockMap, false);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledTimes(OIM_LAYER_IDS.length);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'power_line',
        'visibility',
        'none'
      );
    });

    it('should not set visibility for non-existent layers', () => {
      vi.mocked(mockMap.getLayer).mockReturnValue(undefined);

      setOIMVisibility(mockMap, true);

      expect(mockMap.setLayoutProperty).not.toHaveBeenCalled();
    });

    it('should handle mixed layer existence', () => {
      // Mock: only power_line and power_substation exist
      vi.mocked(mockMap.getLayer).mockImplementation((id: string) => {
        if (id === 'power_line' || id === 'power_substation') {
          return {} as never;
        }
        return undefined;
      });

      setOIMVisibility(mockMap, true);

      // Should only call setLayoutProperty for existing layers
      expect(mockMap.setLayoutProperty).toHaveBeenCalledTimes(2);
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'power_line',
        'visibility',
        'visible'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'power_substation',
        'visibility',
        'visible'
      );
    });
  });

  describe('isOIMVisible', () => {
    let mockMap: MaplibreMap;

    beforeEach(() => {
      mockMap = createMockMap();
    });

    it('should return false if power_line layer does not exist', () => {
      vi.mocked(mockMap.getLayer).mockReturnValue(undefined);

      expect(isOIMVisible(mockMap)).toBe(false);
    });

    it('should return false if visibility is none', () => {
      vi.mocked(mockMap.getLayer).mockReturnValue({} as never);
      vi.mocked(mockMap.getLayoutProperty).mockReturnValue('none');

      expect(isOIMVisible(mockMap)).toBe(false);
    });

    it('should return true if visibility is not none', () => {
      vi.mocked(mockMap.getLayer).mockReturnValue({} as never);
      vi.mocked(mockMap.getLayoutProperty).mockReturnValue('visible');

      expect(isOIMVisible(mockMap)).toBe(true);
    });
  });

  describe('removeOIMFromMap', () => {
    let mockMap: MaplibreMap;

    beforeEach(() => {
      mockMap = createMockMap();
      vi.mocked(mockMap.getLayer).mockReturnValue({} as never);
      vi.mocked(mockMap.getSource).mockReturnValue({} as never);
    });

    it('should remove all OIM layers', () => {
      removeOIMFromMap(mockMap);

      expect(mockMap.removeLayer).toHaveBeenCalledTimes(OIM_LAYER_IDS.length);
    });

    it('should remove OIM source', () => {
      removeOIMFromMap(mockMap);

      expect(mockMap.removeSource).toHaveBeenCalledWith('oim-power');
    });

    it('should not throw if layers do not exist', () => {
      vi.mocked(mockMap.getLayer).mockReturnValue(undefined);
      vi.mocked(mockMap.getSource).mockReturnValue(undefined);

      expect(() => removeOIMFromMap(mockMap)).not.toThrow();
    });
  });

  describe('checkOIMSourceLoaded', () => {
    let mockMap: MaplibreMap;

    beforeEach(() => {
      mockMap = createMockMap();
    });

    it('should return true if source exists', () => {
      vi.mocked(mockMap.getSource).mockReturnValue({} as never);

      expect(checkOIMSourceLoaded(mockMap)).toBe(true);
    });

    it('should return false if source does not exist', () => {
      vi.mocked(mockMap.getSource).mockReturnValue(undefined);

      expect(checkOIMSourceLoaded(mockMap)).toBe(false);
    });
  });
});
