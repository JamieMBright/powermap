'use client';

/**
 * React hook for fetching and caching map data from the UKPN ODP API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import {
  fetchDatasetRecords,
  fetchGeoJSON,
  fetchDatasetMetadata,
  clearCache,
  ODPApiError,
} from '@/lib/ukpn-odp';
import type {
  ODPApiResponse,
  ODPRecord,
  ODPDataset,
  ODPFilterParams,
  ODPGeoBounds,
} from '@/data/types';

/**
 * Hook state for data fetching
 */
export interface UseMapDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  totalCount: number | null;
}

/**
 * Hook options
 */
export interface UseMapDataOptions {
  /** Whether to fetch data immediately */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Keep previous data while fetching new data */
  keepPreviousData?: boolean;
}

/**
 * Convert MapLibre bounds to ODP geo bounds
 */
export function boundsToODPGeoBounds(bounds: LngLatBounds): ODPGeoBounds {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

/**
 * Hook for fetching dataset records
 */
export function useDatasetRecords<TFields = Record<string, unknown>>(
  datasetId: string,
  filter?: ODPFilterParams,
  geoBounds?: ODPGeoBounds,
  options: UseMapDataOptions = {}
): UseMapDataState<ODPRecord<TFields>[]> & {
  refetch: () => Promise<void>;
  fetchMore: (offset: number) => Promise<void>;
  hasMore: boolean;
} {
  const { enabled = true, refetchInterval, keepPreviousData = false } = options;

  const [state, setState] = useState<UseMapDataState<ODPRecord<TFields>[]>>({
    data: null,
    isLoading: false,
    error: null,
    totalCount: null,
  });
  const [hasMore, setHasMore] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      data: keepPreviousData ? prev.data : null,
    }));

    try {
      const response = await fetchDatasetRecords<TFields>(
        datasetId,
        { limit: 100, offset: 0 },
        filter,
        geoBounds,
        { signal: abortControllerRef.current.signal }
      );

      setState({
        data: response.results,
        isLoading: false,
        error: null,
        totalCount: response.total_count,
      });

      setHasMore(response.results.length < response.total_count);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [datasetId, filter, geoBounds, enabled, keepPreviousData]);

  const fetchMore = useCallback(async (offset: number) => {
    if (!enabled || state.isLoading) return;

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchDatasetRecords<TFields>(
        datasetId,
        { limit: 100, offset },
        filter,
        geoBounds,
        { signal: abortControllerRef.current.signal }
      );

      setState(prev => ({
        ...prev,
        data: [...(prev.data || []), ...response.results],
        totalCount: response.total_count,
      }));

      setHasMore(offset + response.results.length < response.total_count);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [datasetId, filter, geoBounds, enabled, state.isLoading]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, enabled, fetchData]);

  return {
    ...state,
    refetch: fetchData,
    fetchMore,
    hasMore,
  };
}

/**
 * Hook for fetching GeoJSON data (optimized for map layers)
 */
export function useGeoJSON<TProperties = Record<string, unknown>>(
  datasetId: string,
  filter?: ODPFilterParams,
  geoBounds?: ODPGeoBounds,
  options: UseMapDataOptions = {}
): UseMapDataState<GeoJSON.FeatureCollection<GeoJSON.Geometry, TProperties>> & {
  refetch: () => Promise<void>;
} {
  const { enabled = true, refetchInterval, keepPreviousData = false } = options;

  const [state, setState] = useState<
    UseMapDataState<GeoJSON.FeatureCollection<GeoJSON.Geometry, TProperties>>
  >({
    data: null,
    isLoading: false,
    error: null,
    totalCount: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      data: keepPreviousData ? prev.data : null,
    }));

    try {
      const data = await fetchGeoJSON<TProperties>(
        datasetId,
        filter,
        geoBounds,
        { signal: abortControllerRef.current.signal }
      );

      setState({
        data,
        isLoading: false,
        error: null,
        totalCount: data.features.length,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [datasetId, filter, geoBounds, enabled, keepPreviousData]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, enabled, fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching dataset metadata
 */
export function useDatasetMetadata(
  datasetId: string,
  options: UseMapDataOptions = {}
): UseMapDataState<ODPDataset> & {
  refetch: () => Promise<void>;
} {
  const { enabled = true } = options;

  const [state, setState] = useState<UseMapDataState<ODPDataset>>({
    data: null,
    isLoading: false,
    error: null,
    totalCount: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await fetchDatasetMetadata(datasetId, {
        signal: abortControllerRef.current.signal,
      });

      setState({
        data,
        isLoading: false,
        error: null,
        totalCount: null,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [datasetId, enabled]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching data within map bounds
 * Automatically refetches when bounds change (with debouncing)
 */
export function useMapBoundsData<TFields = Record<string, unknown>>(
  datasetId: string,
  bounds: LngLatBounds | null,
  filter?: ODPFilterParams,
  options: UseMapDataOptions & { debounceMs?: number } = {}
): UseMapDataState<ODPRecord<TFields>[]> & {
  refetch: () => Promise<void>;
} {
  const { debounceMs = 300, ...restOptions } = options;

  const [debouncedBounds, setDebouncedBounds] = useState<ODPGeoBounds | undefined>(
    bounds ? boundsToODPGeoBounds(bounds) : undefined
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedBounds(bounds ? boundsToODPGeoBounds(bounds) : undefined);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [bounds, debounceMs]);

  const result = useDatasetRecords<TFields>(
    datasetId,
    filter,
    debouncedBounds,
    { ...restOptions, keepPreviousData: true }
  );

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    totalCount: result.totalCount,
    refetch: result.refetch,
  };
}

/**
 * Clear the ODP API cache
 */
export function useClearCache(): () => void {
  return useCallback(() => {
    clearCache();
  }, []);
}

// Re-export error type for convenience
export { ODPApiError };
