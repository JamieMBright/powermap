import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchDatasetRecords,
  fetchDatasetMetadata,
  fetchCatalog,
  fetchGeoJSON,
  fetchAggregation,
  searchDatasets,
  fetchAllDatasetRecords,
  clearCache,
  clearExpiredCache,
  ODPApiError,
} from '@/lib/ukpn-odp';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UKPN ODP API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearCache(); // Clear cache before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ODPApiError', () => {
    it('should create an error with correct properties', () => {
      const error = new ODPApiError('Test error', 404, 'Not Found', { detail: 'Resource not found' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.details).toEqual({ detail: 'Resource not found' });
      expect(error.name).toBe('ODPApiError');
    });

    it('should be an instance of Error', () => {
      const error = new ODPApiError('Test error', 500, 'Internal Server Error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ODPApiError);
    });
  });

  describe('fetchDatasetRecords', () => {
    const mockResponse = {
      total_count: 2,
      results: [
        { id: '1', fields: { name: 'Test 1' } },
        { id: '2', fields: { name: 'Test 2' } },
      ],
    };

    it('should fetch records from the correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDatasetRecords('test-dataset');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/datasets/test-dataset/records'),
        expect.any(Object)
      );
    });

    it('should include limit in query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDatasetRecords('test-dataset', { limit: 50 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=50');
    });

    it('should include offset in query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDatasetRecords('test-dataset', { limit: 100, offset: 50 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('offset=50');
    });

    it('should return parsed response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchDatasetRecords('test-dataset');

      expect(result).toEqual(mockResponse);
    });

    it('should throw ODPApiError on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Dataset not found' }),
      });

      await expect(fetchDatasetRecords('nonexistent')).rejects.toThrow(ODPApiError);
    });

    it('should include geo bounds in where clause', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDatasetRecords(
        'test-dataset',
        undefined,
        undefined,
        { north: 52, south: 51, east: 1, west: -1 }
      );

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('where=');
      expect(calledUrl).toContain('geo_shape');
    });

    it('should use cache by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call should make a fetch request
      await fetchDatasetRecords('test-dataset');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await fetchDatasetRecords('test-dataset');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when useCache is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDatasetRecords('test-dataset', undefined, undefined, undefined, { useCache: false });
      await fetchDatasetRecords('test-dataset', undefined, undefined, undefined, { useCache: false });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchDatasetMetadata', () => {
    const mockMetadata = {
      dataset_id: 'test-dataset',
      metas: {
        default: {
          title: 'Test Dataset',
          description: 'A test dataset',
        },
      },
    };

    it('should fetch metadata from the correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      });

      await fetchDatasetMetadata('test-dataset');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/datasets/test-dataset'),
        expect.any(Object)
      );
    });

    it('should return parsed metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      });

      const result = await fetchDatasetMetadata('test-dataset');

      expect(result).toEqual(mockMetadata);
    });
  });

  describe('fetchCatalog', () => {
    const mockCatalog = {
      total_count: 10,
      results: [
        { dataset_id: 'dataset-1' },
        { dataset_id: 'dataset-2' },
      ],
    };

    it('should fetch catalog from the correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCatalog),
      });

      await fetchCatalog();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/datasets'),
        expect.any(Object)
      );
    });

    it('should include pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCatalog),
      });

      await fetchCatalog({ limit: 10, offset: 20 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=20');
    });
  });

  describe('fetchGeoJSON', () => {
    const mockGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test Feature' },
          geometry: { type: 'Point', coordinates: [0, 51] },
        },
      ],
    };

    it('should fetch GeoJSON from the exports endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      await fetchGeoJSON('test-dataset');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/datasets/test-dataset/exports/geojson'),
        expect.any(Object)
      );
    });

    it('should return parsed GeoJSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      const result = await fetchGeoJSON('test-dataset');

      expect(result).toEqual(mockGeoJSON);
      expect(result.type).toBe('FeatureCollection');
    });

    it('should include filter parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      await fetchGeoJSON('test-dataset', { where: "voltage > 11000" });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('where=');
    });

    it('should include geo bounds filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      await fetchGeoJSON(
        'test-dataset',
        undefined,
        { north: 52, south: 51, east: 1, west: -1 }
      );

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('where=');
      expect(calledUrl).toContain('geo_shape');
    });
  });

  describe('fetchAggregation', () => {
    const mockAggregation = {
      total_count: 3,
      results: [
        { id: '1', fields: { voltage: 11000, count: 100 } },
        { id: '2', fields: { voltage: 33000, count: 50 } },
        { id: '3', fields: { voltage: 132000, count: 10 } },
      ],
    };

    it('should include select parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAggregation),
      });

      await fetchAggregation('test-dataset', ['voltage', 'count(*)']);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('select=voltage%2Ccount(*)');
    });

    it('should include group_by parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAggregation),
      });

      await fetchAggregation('test-dataset', ['voltage', 'count(*)'], ['voltage']);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('group_by=voltage');
    });
  });

  describe('searchDatasets', () => {
    const mockSearchResults = {
      total_count: 2,
      results: [
        { dataset_id: 'substations' },
        { dataset_id: 'cables' },
      ],
    };

    it('should include search query parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      });

      await searchDatasets('substation');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('q=substation');
    });

    it('should include pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      });

      await searchDatasets('power', { limit: 5, offset: 10 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=5');
      expect(calledUrl).toContain('offset=10');
    });
  });

  describe('fetchAllDatasetRecords', () => {
    it('should handle pagination automatically', async () => {
      const firstPage = {
        total_count: 150,
        results: Array.from({ length: 100 }, (_, i) => ({
          id: `record-${i}`,
          fields: { name: `Record ${i}` },
        })),
      };

      const secondPage = {
        total_count: 150,
        results: Array.from({ length: 50 }, (_, i) => ({
          id: `record-${i + 100}`,
          fields: { name: `Record ${i + 100}` },
        })),
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstPage),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondPage),
        });

      const result = await fetchAllDatasetRecords('test-dataset');

      expect(result).toHaveLength(150);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should stop when receiving fewer records than limit', async () => {
      const response = {
        total_count: 50,
        results: Array.from({ length: 50 }, (_, i) => ({
          id: `record-${i}`,
          fields: { name: `Record ${i}` },
        })),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      });

      const result = await fetchAllDatasetRecords('test-dataset');

      expect(result).toHaveLength(50);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache functions', () => {
    it('clearCache should clear all cached responses', async () => {
      const mockResponse = {
        total_count: 1,
        results: [{ id: '1', fields: {} }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Make a request to populate cache
      await fetchDatasetRecords('test-dataset');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      clearCache();

      // Next request should make a new fetch call
      await fetchDatasetRecords('test-dataset');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('clearExpiredCache should be callable', () => {
      // Just verify it doesn't throw
      expect(() => clearExpiredCache()).not.toThrow();
    });
  });

  describe('request handling', () => {
    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total_count: 0, results: [] }),
      });

      await fetchDatasetRecords('test-dataset');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should pass abort signal when provided', async () => {
      const controller = new AbortController();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total_count: 0, results: [] }),
      });

      await fetchDatasetRecords('test-dataset', undefined, undefined, undefined, {
        signal: controller.signal,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Not JSON')),
      });

      await expect(fetchDatasetRecords('test-dataset')).rejects.toThrow(ODPApiError);
    });
  });
});
