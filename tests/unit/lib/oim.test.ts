import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OIM_SOURCE,
  POWER_LINE_LAYER,
  SUBSTATION_LAYER,
  SUBSTATION_LABEL_LAYER,
  addOIMToMap,
  setOIMVisibility,
} from '@/lib/oim';
import type { Map as MaplibreMap } from 'maplibre-gl';

// Mock MapLibre Map
function createMockMap(): MaplibreMap {
  const sources = new Map<string, unknown>();
  const layers = new Map<string, unknown>();

  return {
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, source: unknown) => {
      sources.set(id, source);
    }),
    getLayer: vi.fn((id: string) => layers.get(id)),
    addLayer: vi.fn((layer: { id: string }) => {
      layers.set(layer.id, layer);
    }),
    setLayoutProperty: vi.fn(),
  } as unknown as MaplibreMap;
}

describe('OIM (Open Infrastructure Map) Module', () => {
  describe('OIM_SOURCE', () => {
    it('should be a vector tile source', () => {
      expect(OIM_SOURCE.type).toBe('vector');
    });

    it('should have correct tile URL', () => {
      expect(OIM_SOURCE.tiles).toContain(
        'https://openinframap.org/tiles/power/{z}/{x}/{y}.pbf'
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

  describe('POWER_LINE_LAYER', () => {
    it('should have correct layer configuration', () => {
      expect(POWER_LINE_LAYER.id).toBe('oim-power-line');
      expect(POWER_LINE_LAYER.type).toBe('line');
      expect(POWER_LINE_LAYER.source).toBe('oim-power');
      expect(POWER_LINE_LAYER['source-layer']).toBe('power_line');
    });

    it('should have minzoom set', () => {
      expect(POWER_LINE_LAYER.minzoom).toBe(3);
    });

    it('should have paint properties', () => {
      expect(POWER_LINE_LAYER.paint).toBeDefined();
      expect(POWER_LINE_LAYER.paint).toHaveProperty('line-color');
      expect(POWER_LINE_LAYER.paint).toHaveProperty('line-width');
      expect(POWER_LINE_LAYER.paint).toHaveProperty('line-opacity');
    });

    it('should have layout properties for line caps', () => {
      expect(POWER_LINE_LAYER.layout).toBeDefined();
      expect(POWER_LINE_LAYER.layout).toHaveProperty('line-cap', 'round');
      expect(POWER_LINE_LAYER.layout).toHaveProperty('line-join', 'round');
    });
  });

  describe('SUBSTATION_LAYER', () => {
    it('should have correct layer configuration', () => {
      expect(SUBSTATION_LAYER.id).toBe('oim-substation');
      expect(SUBSTATION_LAYER.type).toBe('circle');
      expect(SUBSTATION_LAYER.source).toBe('oim-power');
      expect(SUBSTATION_LAYER['source-layer']).toBe('power_substation');
    });

    it('should have minzoom set', () => {
      expect(SUBSTATION_LAYER.minzoom).toBe(8);
    });

    it('should have paint properties for circle styling', () => {
      expect(SUBSTATION_LAYER.paint).toBeDefined();
      expect(SUBSTATION_LAYER.paint).toHaveProperty('circle-radius');
      expect(SUBSTATION_LAYER.paint).toHaveProperty('circle-color');
      expect(SUBSTATION_LAYER.paint).toHaveProperty('circle-stroke-width');
      expect(SUBSTATION_LAYER.paint).toHaveProperty('circle-stroke-color');
      expect(SUBSTATION_LAYER.paint).toHaveProperty('circle-opacity');
    });
  });

  describe('SUBSTATION_LABEL_LAYER', () => {
    it('should have correct layer configuration', () => {
      expect(SUBSTATION_LABEL_LAYER.id).toBe('oim-substation-label');
      expect(SUBSTATION_LABEL_LAYER.type).toBe('symbol');
      expect(SUBSTATION_LABEL_LAYER.source).toBe('oim-power');
      expect(SUBSTATION_LABEL_LAYER['source-layer']).toBe('power_substation');
    });

    it('should have minzoom for labels', () => {
      expect(SUBSTATION_LABEL_LAYER.minzoom).toBe(11);
    });

    it('should have layout properties for text', () => {
      expect(SUBSTATION_LABEL_LAYER.layout).toBeDefined();
      expect(SUBSTATION_LABEL_LAYER.layout).toHaveProperty('text-field');
      expect(SUBSTATION_LABEL_LAYER.layout).toHaveProperty('text-size');
      expect(SUBSTATION_LABEL_LAYER.layout).toHaveProperty('text-anchor');
    });

    it('should have paint properties for text styling', () => {
      expect(SUBSTATION_LABEL_LAYER.paint).toBeDefined();
      expect(SUBSTATION_LABEL_LAYER.paint).toHaveProperty('text-color');
      expect(SUBSTATION_LABEL_LAYER.paint).toHaveProperty('text-halo-color');
      expect(SUBSTATION_LABEL_LAYER.paint).toHaveProperty('text-halo-width');
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

    it('should add power line layer if not already present', () => {
      addOIMToMap(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(POWER_LINE_LAYER);
    });

    it('should add substation layer if not already present', () => {
      addOIMToMap(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(SUBSTATION_LAYER);
    });

    it('should add substation label layer if not already present', () => {
      addOIMToMap(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(SUBSTATION_LABEL_LAYER);
    });

    it('should not add layers if already present', () => {
      vi.mocked(mockMap.getLayer)
        .mockReturnValueOnce({} as never) // power line layer exists
        .mockReturnValueOnce({} as never) // substation layer exists
        .mockReturnValueOnce({} as never); // substation label layer exists

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

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-power-line',
        'visibility',
        'visible'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-substation',
        'visibility',
        'visible'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-substation-label',
        'visibility',
        'visible'
      );
    });

    it('should set visibility to none for all OIM layers', () => {
      setOIMVisibility(mockMap, false);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-power-line',
        'visibility',
        'none'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-substation',
        'visibility',
        'none'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-substation-label',
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
      vi.mocked(mockMap.getLayer)
        .mockReturnValueOnce({} as never) // power line exists
        .mockReturnValueOnce(undefined) // substation doesn't exist
        .mockReturnValueOnce({} as never); // substation label exists

      setOIMVisibility(mockMap, true);

      expect(mockMap.setLayoutProperty).toHaveBeenCalledTimes(2);
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-power-line',
        'visibility',
        'visible'
      );
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'oim-substation-label',
        'visibility',
        'visible'
      );
    });
  });
});
