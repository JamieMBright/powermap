/**
 * UK Power Networks Open Data Portal API Client
 *
 * API Documentation: https://help.opendatasoft.com/apis/ods-explore-v2/
 * UKPN ODP Portal: https://ukpowernetworks.opendatasoft.com/
 */

import type {
  ODPApiResponse,
  ODPRecord,
  ODPDataset,
  ODPPaginationParams,
  ODPFilterParams,
  ODPGeoBounds,
  ODPRequestOptions,
  ODPCacheEntry,
} from '@/data/types';

// API Configuration
const DEFAULT_BASE_URL = 'https://ukpowernetworks.opendatasoft.com/api/v2';
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache for API responses
const responseCache = new Map<string, ODPCacheEntry<unknown>>();

/**
 * Get the API base URL from environment or use default
 */
function getBaseUrl(): string {
  return process.env.UKPN_ODP_BASE_URL || DEFAULT_BASE_URL;
}

/**
 * Get the API key from environment
 */
function getApiKey(): string | undefined {
  return process.env.UKPN_ODP_API_KEY;
}

/**
 * Generate a cache key from request parameters
 */
function generateCacheKey(endpoint: string, params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

/**
 * Check if a cache entry is still valid
 */
function isCacheValid<T>(entry: ODPCacheEntry<T> | undefined): entry is ODPCacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      responseCache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  responseCache.clear();
}

/**
 * Build query parameters for the API request
 */
function buildQueryParams(
  pagination?: ODPPaginationParams,
  filter?: ODPFilterParams,
  geoBounds?: ODPGeoBounds
): Record<string, string> {
  const params: Record<string, string> = {};

  // Pagination
  const limit = Math.min(pagination?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  params.limit = String(limit);

  if (pagination?.offset) {
    params.offset = String(pagination.offset);
  }

  // Build where clause for filters
  const whereClauses: string[] = [];

  if (filter?.where) {
    whereClauses.push(filter.where);
  }

  // Geographic bounds filter using OpenDataSoft's geo functions
  if (geoBounds) {
    const { north, south, east, west } = geoBounds;
    // Use polygon intersection for bounding box filter
    const geoFilter = `geo_shape(geo_point_2d, geom'POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))')`;
    whereClauses.push(geoFilter);
  }

  if (whereClauses.length > 0) {
    params.where = whereClauses.join(' AND ');
  }

  // Select specific fields
  if (filter?.select && filter.select.length > 0) {
    params.select = filter.select.join(',');
  }

  // Group by
  if (filter?.groupBy && filter.groupBy.length > 0) {
    params.group_by = filter.groupBy.join(',');
  }

  // Order by
  if (filter?.orderBy) {
    params.order_by = filter.orderBy;
  }

  // Refine (facet filtering)
  if (filter?.refine) {
    Object.entries(filter.refine).forEach(([facet, value]) => {
      params[`refine.${facet}`] = value;
    });
  }

  return params;
}

/**
 * Custom error class for ODP API errors
 */
export class ODPApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ODPApiError';
  }
}

/**
 * Make an authenticated request to the ODP API
 */
async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
  options: ODPRequestOptions = {}
): Promise<T> {
  const { useCache = true, signal } = options;
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();

  // Generate cache key and check cache
  const cacheKey = generateCacheKey(endpoint, params);
  if (useCache) {
    const cached = responseCache.get(cacheKey) as ODPCacheEntry<T> | undefined;
    if (isCacheValid(cached)) {
      return cached.data;
    }
  }

  // Build URL with query parameters
  const url = new URL(endpoint, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Apikey ${apiKey}`;
  }

  // Make request
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
    signal,
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      // Response body not JSON
    }

    throw new ODPApiError(
      `ODP API request failed: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
      details
    );
  }

  const data = await response.json() as T;

  // Cache the response
  if (useCache) {
    responseCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  return data;
}

/**
 * Fetch records from a dataset
 */
export async function fetchDatasetRecords<TFields = Record<string, unknown>>(
  datasetId: string,
  pagination?: ODPPaginationParams,
  filter?: ODPFilterParams,
  geoBounds?: ODPGeoBounds,
  options?: ODPRequestOptions
): Promise<ODPApiResponse<TFields>> {
  const endpoint = `/catalog/datasets/${datasetId}/records`;
  const params = buildQueryParams(pagination, filter, geoBounds);

  return makeRequest<ODPApiResponse<TFields>>(endpoint, params, options);
}

/**
 * Fetch all records from a dataset (handles pagination automatically)
 * Use with caution for large datasets
 */
export async function fetchAllDatasetRecords<TFields = Record<string, unknown>>(
  datasetId: string,
  filter?: ODPFilterParams,
  geoBounds?: ODPGeoBounds,
  options?: ODPRequestOptions
): Promise<ODPRecord<TFields>[]> {
  const allRecords: ODPRecord<TFields>[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchDatasetRecords<TFields>(
      datasetId,
      { limit: MAX_LIMIT, offset },
      filter,
      geoBounds,
      options
    );

    allRecords.push(...response.results);

    if (response.results.length < MAX_LIMIT) {
      hasMore = false;
    } else {
      offset += MAX_LIMIT;
    }

    // Safety limit to prevent infinite loops
    if (allRecords.length >= 10000) {
      console.warn('fetchAllDatasetRecords: Reached safety limit of 10000 records');
      break;
    }
  }

  return allRecords;
}

/**
 * Fetch dataset metadata
 */
export async function fetchDatasetMetadata(
  datasetId: string,
  options?: ODPRequestOptions
): Promise<ODPDataset> {
  const endpoint = `/catalog/datasets/${datasetId}`;
  return makeRequest<ODPDataset>(endpoint, {}, options);
}

/**
 * Fetch available datasets from the catalog
 */
export async function fetchCatalog(
  pagination?: ODPPaginationParams,
  filter?: ODPFilterParams,
  options?: ODPRequestOptions
): Promise<ODPApiResponse<ODPDataset>> {
  const endpoint = '/catalog/datasets';
  const params = buildQueryParams(pagination, filter);

  return makeRequest<ODPApiResponse<ODPDataset>>(endpoint, params, options);
}

/**
 * Fetch aggregated data from a dataset
 */
export async function fetchAggregation<TFields = Record<string, unknown>>(
  datasetId: string,
  select: string[],
  groupBy?: string[],
  filter?: ODPFilterParams,
  options?: ODPRequestOptions
): Promise<ODPApiResponse<TFields>> {
  const endpoint = `/catalog/datasets/${datasetId}/records`;
  const params = buildQueryParams(
    undefined,
    { ...filter, select, groupBy }
  );

  return makeRequest<ODPApiResponse<TFields>>(endpoint, params, options);
}

/**
 * Search across all datasets
 */
export async function searchDatasets(
  query: string,
  pagination?: ODPPaginationParams,
  options?: ODPRequestOptions
): Promise<ODPApiResponse<ODPDataset>> {
  const endpoint = '/catalog/datasets';
  const params = buildQueryParams(pagination);
  params.q = query;

  return makeRequest<ODPApiResponse<ODPDataset>>(endpoint, params, options);
}

/**
 * Export records in GeoJSON format (for direct use with MapLibre)
 */
export async function fetchGeoJSON<TProperties = Record<string, unknown>>(
  datasetId: string,
  filter?: ODPFilterParams,
  geoBounds?: ODPGeoBounds,
  options?: ODPRequestOptions
): Promise<GeoJSON.FeatureCollection<GeoJSON.Geometry, TProperties>> {
  const endpoint = `/catalog/datasets/${datasetId}/exports/geojson`;
  const params: Record<string, string> = {};

  // Build where clause for filters
  const whereClauses: string[] = [];

  if (filter?.where) {
    whereClauses.push(filter.where);
  }

  if (geoBounds) {
    const { north, south, east, west } = geoBounds;
    const geoFilter = `geo_shape(geo_point_2d, geom'POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))')`;
    whereClauses.push(geoFilter);
  }

  if (whereClauses.length > 0) {
    params.where = whereClauses.join(' AND ');
  }

  if (filter?.select && filter.select.length > 0) {
    params.select = filter.select.join(',');
  }

  return makeRequest<GeoJSON.FeatureCollection<GeoJSON.Geometry, TProperties>>(
    endpoint,
    params,
    options
  );
}

// Export types for external use
export type {
  ODPApiResponse,
  ODPRecord,
  ODPDataset,
  ODPPaginationParams,
  ODPFilterParams,
  ODPGeoBounds,
  ODPRequestOptions,
};
