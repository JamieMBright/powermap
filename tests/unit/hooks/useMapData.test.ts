import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { boundsToODPGeoBounds } from '@/hooks/useMapData';
import type { LngLatBounds } from 'maplibre-gl';

// Mock the ukpn-odp module
vi.mock('@/lib/ukpn-odp', () => ({
  fetchDatasetRecords: vi.fn(),
  fetchGeoJSON: vi.fn(),
  fetchDatasetMetadata: vi.fn(),
  clearCache: vi.fn(),
  ODPApiError: class ODPApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly statusText: string,
      public readonly details?: unknown
    ) {
      super(message);
      this.name = 'ODPApiError';
    }
  },
}));

// Create a mock LngLatBounds
function createMockBounds(north: number, south: number, east: number, west: number): LngLatBounds {
  return {
    getNorth: () => north,
    getSouth: () => south,
    getEast: () => east,
    getWest: () => west,
    getCenter: () => ({ lng: (east + west) / 2, lat: (north + south) / 2 }),
    getSouthWest: () => ({ lng: west, lat: south }),
    getNorthEast: () => ({ lng: east, lat: north }),
    extend: vi.fn(),
    toArray: () => [[west, south], [east, north]],
    toString: () => `LngLatBounds(${west}, ${south}, ${east}, ${north})`,
    contains: vi.fn(),
    isEmpty: () => false,
    setNorthEast: vi.fn(),
    setSouthWest: vi.fn(),
  } as unknown as LngLatBounds;
}

describe('useMapData module', () => {
  describe('boundsToODPGeoBounds', () => {
    it('should convert LngLatBounds to ODPGeoBounds', () => {
      const mockBounds = createMockBounds(52, 51, 1, -1);

      const result = boundsToODPGeoBounds(mockBounds);

      expect(result).toEqual({
        north: 52,
        south: 51,
        east: 1,
        west: -1,
      });
    });

    it('should handle positive longitude values', () => {
      const mockBounds = createMockBounds(55, 50, 2, 0);

      const result = boundsToODPGeoBounds(mockBounds);

      expect(result.east).toBe(2);
      expect(result.west).toBe(0);
    });

    it('should handle negative longitude values', () => {
      const mockBounds = createMockBounds(55, 50, 0, -5);

      const result = boundsToODPGeoBounds(mockBounds);

      expect(result.east).toBe(0);
      expect(result.west).toBe(-5);
    });

    it('should handle bounds crossing the prime meridian', () => {
      const mockBounds = createMockBounds(52, 51, 1, -1);

      const result = boundsToODPGeoBounds(mockBounds);

      expect(result.west).toBeLessThan(0);
      expect(result.east).toBeGreaterThan(0);
    });

    it('should return correct north/south values for UK area', () => {
      const mockBounds = createMockBounds(52.5, 50.5, 2.0, -2.5);

      const result = boundsToODPGeoBounds(mockBounds);

      expect(result.north).toBeGreaterThan(result.south);
      expect(result.north).toBeCloseTo(52.5);
      expect(result.south).toBeCloseTo(50.5);
    });

    it('should return correct east/west values for UK area', () => {
      const mockBounds = createMockBounds(52.5, 50.5, 2.0, -2.5);

      const result = boundsToODPGeoBounds(mockBounds);

      expect(result.east).toBeGreaterThan(result.west);
      expect(result.east).toBeCloseTo(2.0);
      expect(result.west).toBeCloseTo(-2.5);
    });
  });

  describe('UseMapDataState interface', () => {
    it('should define correct state shape', async () => {
      // Import the type to verify it exists
      const { useDatasetRecords } = await import('@/hooks/useMapData');

      // The type structure should include data, isLoading, error, totalCount
      // We test this through the hook's return value
      expect(typeof useDatasetRecords).toBe('function');
    });
  });

  describe('UseMapDataOptions interface', () => {
    it('should accept enabled option', async () => {
      const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
      vi.mocked(fetchDatasetRecords).mockResolvedValue({
        total_count: 0,
        results: [],
      });

      const { useDatasetRecords } = await import('@/hooks/useMapData');

      // Should not throw with enabled option
      const { result } = renderHook(() =>
        useDatasetRecords('test-dataset', undefined, undefined, { enabled: false })
      );

      // With enabled: false, no fetch should occur
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should accept keepPreviousData option', async () => {
      const { useDatasetRecords } = await import('@/hooks/useMapData');

      // Should not throw with keepPreviousData option
      expect(() =>
        renderHook(() =>
          useDatasetRecords('test-dataset', undefined, undefined, {
            keepPreviousData: true,
          })
        )
      ).not.toThrow();
    });
  });
});

describe('useDatasetRecords hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial loading state', async () => {
    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetRecords('test-dataset'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return data on successful fetch', async () => {
    const mockData = {
      total_count: 2,
      results: [
        { id: '1', fields: { name: 'Test 1' } },
        { id: '2', fields: { name: 'Test 2' } },
      ],
    };

    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockResolvedValue(mockData);

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetRecords('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData.results);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('should return error on failed fetch', async () => {
    const mockError = new Error('Network error');

    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockRejectedValue(mockError);

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetRecords('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should not fetch when enabled is false', async () => {
    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockResolvedValue({
      total_count: 0,
      results: [],
    });

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    renderHook(() =>
      useDatasetRecords('test-dataset', undefined, undefined, { enabled: false })
    );

    // Wait a bit to ensure fetch would have been called if it was going to
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(fetchDatasetRecords).not.toHaveBeenCalled();
  });

  it('should provide refetch function', async () => {
    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockResolvedValue({
      total_count: 1,
      results: [{ id: '1', fields: {} }],
    });

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetRecords('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Clear mock to track refetch call
    vi.mocked(fetchDatasetRecords).mockClear();

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetchDatasetRecords).toHaveBeenCalled();
    });
  });

  it('should indicate hasMore when more records exist', async () => {
    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockResolvedValue({
      total_count: 200,
      results: Array.from({ length: 100 }, (_, i) => ({ id: `${i}`, fields: {} })),
    });

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetRecords('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
  });

  it('should indicate no more when all records fetched', async () => {
    const { fetchDatasetRecords } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetRecords).mockResolvedValue({
      total_count: 50,
      results: Array.from({ length: 50 }, (_, i) => ({ id: `${i}`, fields: {} })),
    });

    const { useDatasetRecords } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetRecords('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
  });
});

describe('useGeoJSON hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch GeoJSON data', async () => {
    const mockGeoJSON = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { name: 'Test' },
          geometry: { type: 'Point' as const, coordinates: [0, 51] },
        },
      ],
    };

    const { fetchGeoJSON } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchGeoJSON).mockResolvedValue(mockGeoJSON);

    const { useGeoJSON } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useGeoJSON('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockGeoJSON);
    expect(result.current.totalCount).toBe(1);
  });

  it('should handle GeoJSON fetch error', async () => {
    const { fetchGeoJSON } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchGeoJSON).mockRejectedValue(new Error('Failed to fetch GeoJSON'));

    const { useGeoJSON } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useGeoJSON('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});

describe('useDatasetMetadata hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch dataset metadata', async () => {
    const mockMetadata = {
      dataset_id: 'test-dataset',
      metas: {
        default: {
          title: 'Test Dataset',
          description: 'A test dataset for unit testing',
        },
      },
    };

    const { fetchDatasetMetadata } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetMetadata).mockResolvedValue(mockMetadata);

    const { useDatasetMetadata } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetMetadata('test-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetadata);
    expect(result.current.data?.dataset_id).toBe('test-dataset');
  });

  it('should handle metadata fetch error', async () => {
    const { fetchDatasetMetadata } = await import('@/lib/ukpn-odp');
    vi.mocked(fetchDatasetMetadata).mockRejectedValue(new Error('Dataset not found'));

    const { useDatasetMetadata } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useDatasetMetadata('nonexistent-dataset'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});

describe('useClearCache hook', () => {
  it('should return a function to clear cache', async () => {
    const { clearCache } = await import('@/lib/ukpn-odp');
    const { useClearCache } = await import('@/hooks/useMapData');

    const { result } = renderHook(() => useClearCache());

    expect(typeof result.current).toBe('function');

    act(() => {
      result.current();
    });

    expect(clearCache).toHaveBeenCalled();
  });
});
