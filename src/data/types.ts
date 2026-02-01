import type { Feature, Polygon, MultiPolygon, Point, LineString, Geometry } from 'geojson';

// Investment driver types
export type InvestmentDriver =
  | 'asset_replacement'
  | 'load_reinforcement'
  | 'proactive_investment'
  | 'fault_level'
  | 'reverse_power_flow'
  | 'connections';

// Asset types
export type AssetType =
  | 'substation'
  | 'transformer'
  | 'cable'
  | 'overhead_line'
  | 'switchgear';

// Boundary types
export type BoundaryType = 'resp' | 'gsp' | 'la' | 'lsoa';

// Asset investment record
export interface AssetInvestment {
  id: string;
  year: number;
  location: {
    lat: number;
    lng: number;
    geometry?: Geometry;
  };
  boundaries: {
    resp: string;
    gsp: string;
    la: string;
    lsoa: string;
  };
  investment: {
    amount: number;
    driver: InvestmentDriver;
    type: AssetType;
  };
  metadata: {
    projectName?: string;
    wbsCode?: string;
    description?: string;
  };
}

// Boundary feature properties
export interface BoundaryProperties {
  code: string;
  name: string;
  aggregates?: {
    totalInvestment: number;
    assetCount: number;
    byDriver: Record<InvestmentDriver, number>;
  };
}

// Boundary GeoJSON feature
export type BoundaryFeature = Feature<Polygon | MultiPolygon, BoundaryProperties>;

// Note: Story tour types are defined in ./tour-types.ts

// =============================================================================
// UK Power Networks Open Data Portal (ODP) API Types
// =============================================================================

/**
 * ODP API pagination parameters
 */
export interface ODPPaginationParams {
  /** Number of records to return (max 100) */
  limit?: number;
  /** Number of records to skip */
  offset?: number;
}

/**
 * ODP API filter parameters
 */
export interface ODPFilterParams {
  /** ODSQL WHERE clause for filtering */
  where?: string;
  /** Fields to select */
  select?: string[];
  /** Fields to group by */
  groupBy?: string[];
  /** Order by clause (e.g., "field_name ASC") */
  orderBy?: string;
  /** Facet refinements */
  refine?: Record<string, string>;
}

/**
 * Geographic bounds for filtering
 */
export interface ODPGeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * ODP API request options
 */
export interface ODPRequestOptions {
  /** Whether to use cached response if available */
  useCache?: boolean;
  /** AbortSignal for cancelling requests */
  signal?: AbortSignal;
}

/**
 * ODP API cache entry
 */
export interface ODPCacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * ODP API record wrapper
 */
export interface ODPRecord<TFields = Record<string, unknown>> {
  /** Unique record identifier */
  id: string;
  /** Record fields/values */
  fields: TFields;
  /** Record timestamp */
  record_timestamp?: string;
}

/**
 * ODP API response envelope
 */
export interface ODPApiResponse<TFields = Record<string, unknown>> {
  /** Total number of matching records */
  total_count: number;
  /** Array of record results */
  results: ODPRecord<TFields>[];
  /** Links for pagination */
  links?: {
    next?: string;
    prev?: string;
  };
}

/**
 * ODP Dataset metadata
 */
export interface ODPDataset {
  /** Dataset identifier */
  dataset_id: string;
  /** Dataset metadata */
  metas?: {
    default?: {
      title?: string;
      description?: string;
      modified?: string;
      publisher?: string;
      records_count?: number;
      geographic_reference?: string[];
      keyword?: string[];
    };
  };
  /** Dataset fields definition */
  fields?: ODPDatasetField[];
}

/**
 * ODP Dataset field definition
 */
export interface ODPDatasetField {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field type */
  type: string;
  /** Field description */
  description?: string;
  /** Annotations/metadata */
  annotations?: Record<string, unknown>;
}
