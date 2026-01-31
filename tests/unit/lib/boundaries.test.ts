import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BOUNDARY_CONFIGS,
  getBoundarySourceId,
  getBoundaryLayerIds,
  getBoundaryTypes,
  getBoundaryConfig,
  loadBoundaryData,
} from '@/lib/boundaries';
import type { BoundaryType } from '@/data/types';

describe('boundaries', () => {
  describe('BOUNDARY_CONFIGS', () => {
    it('should contain all boundary types', () => {
      expect(BOUNDARY_CONFIGS).toHaveProperty('resp');
      expect(BOUNDARY_CONFIGS).toHaveProperty('gsp');
      expect(BOUNDARY_CONFIGS).toHaveProperty('la');
      expect(BOUNDARY_CONFIGS).toHaveProperty('lsoa');
    });

    it('should have valid config structure for each boundary type', () => {
      const requiredFields = ['id', 'name', 'description', 'dataPath', 'minZoom', 'labelMinZoom', 'colors'];

      Object.values(BOUNDARY_CONFIGS).forEach((config) => {
        requiredFields.forEach((field) => {
          expect(config).toHaveProperty(field);
        });

        // Validate colors object
        expect(config.colors).toHaveProperty('fill');
        expect(config.colors).toHaveProperty('line');
        expect(config.colors).toHaveProperty('highlight');
      });
    });

    it('should have correct data paths for each boundary type', () => {
      expect(BOUNDARY_CONFIGS.resp.dataPath).toBe('/data/boundaries/resp.geojson');
      expect(BOUNDARY_CONFIGS.gsp.dataPath).toBe('/data/boundaries/gsp.geojson');
      expect(BOUNDARY_CONFIGS.la.dataPath).toBe('/data/boundaries/la.geojson');
      expect(BOUNDARY_CONFIGS.lsoa.dataPath).toBe('/data/boundaries/lsoa.geojson');
    });

    it('should have minZoom less than or equal to labelMinZoom for each type', () => {
      Object.values(BOUNDARY_CONFIGS).forEach((config) => {
        expect(config.minZoom).toBeLessThanOrEqual(config.labelMinZoom);
      });
    });
  });

  describe('getBoundarySourceId', () => {
    it('should return correct source ID for resp', () => {
      expect(getBoundarySourceId('resp')).toBe('boundary-resp');
    });

    it('should return correct source ID for gsp', () => {
      expect(getBoundarySourceId('gsp')).toBe('boundary-gsp');
    });

    it('should return correct source ID for la', () => {
      expect(getBoundarySourceId('la')).toBe('boundary-la');
    });

    it('should return correct source ID for lsoa', () => {
      expect(getBoundarySourceId('lsoa')).toBe('boundary-lsoa');
    });
  });

  describe('getBoundaryLayerIds', () => {
    it('should return all layer IDs for a boundary type', () => {
      const layerIds = getBoundaryLayerIds('resp');

      expect(layerIds).toEqual({
        fill: 'boundary-resp-fill',
        line: 'boundary-resp-line',
        highlight: 'boundary-resp-highlight',
        label: 'boundary-resp-label',
      });
    });

    it('should return correct layer IDs for each boundary type', () => {
      const types: BoundaryType[] = ['resp', 'gsp', 'la', 'lsoa'];

      types.forEach((type) => {
        const layerIds = getBoundaryLayerIds(type);

        expect(layerIds.fill).toBe(`boundary-${type}-fill`);
        expect(layerIds.line).toBe(`boundary-${type}-line`);
        expect(layerIds.highlight).toBe(`boundary-${type}-highlight`);
        expect(layerIds.label).toBe(`boundary-${type}-label`);
      });
    });
  });

  describe('getBoundaryTypes', () => {
    it('should return all boundary types in order', () => {
      expect(getBoundaryTypes()).toEqual(['resp', 'gsp', 'la', 'lsoa']);
    });

    it('should return a new array each time', () => {
      const types1 = getBoundaryTypes();
      const types2 = getBoundaryTypes();

      expect(types1).not.toBe(types2);
      expect(types1).toEqual(types2);
    });
  });

  describe('getBoundaryConfig', () => {
    it('should return the correct config for each boundary type', () => {
      const types: BoundaryType[] = ['resp', 'gsp', 'la', 'lsoa'];

      types.forEach((type) => {
        const config = getBoundaryConfig(type);
        expect(config).toBe(BOUNDARY_CONFIGS[type]);
        expect(config.id).toBe(type);
      });
    });

    it('should return config with correct name for resp', () => {
      expect(getBoundaryConfig('resp').name).toBe('RESP');
    });

    it('should return config with correct name for gsp', () => {
      expect(getBoundaryConfig('gsp').name).toBe('GSP');
    });

    it('should return config with correct name for la', () => {
      expect(getBoundaryConfig('la').name).toBe('Local Authority');
    });

    it('should return config with correct name for lsoa', () => {
      expect(getBoundaryConfig('lsoa').name).toBe('LSOA');
    });
  });

  describe('loadBoundaryData', () => {
    const mockGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { code: 'TEST001', name: 'Test Boundary' },
          geometry: { type: 'Polygon', coordinates: [] },
        },
      ],
    };

    beforeEach(() => {
      vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch GeoJSON data from the correct path', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      } as Response);

      await loadBoundaryData('resp');

      expect(global.fetch).toHaveBeenCalledWith('/data/boundaries/resp.geojson');
    });

    it('should return parsed GeoJSON data on success', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      } as Response);

      const result = await loadBoundaryData('gsp');

      expect(result).toEqual(mockGeoJSON);
    });

    it('should throw an error when fetch fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(loadBoundaryData('la')).rejects.toThrow(
        'Failed to load boundary data for la: Not Found'
      );
    });

    it('should use correct path for each boundary type', async () => {
      const types: BoundaryType[] = ['resp', 'gsp', 'la', 'lsoa'];

      for (const type of types) {
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeoJSON),
        } as Response);

        await loadBoundaryData(type);

        expect(global.fetch).toHaveBeenLastCalledWith(
          BOUNDARY_CONFIGS[type].dataPath
        );
      }
    });
  });
});
