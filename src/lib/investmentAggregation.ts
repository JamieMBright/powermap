/**
 * Investment data aggregation utilities
 * Aggregates geo-positioned asset investments by boundary areas using point-in-polygon
 */

import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson';

// Types for investment data
export interface InvestmentByDriver {
  asset_replacement?: number;
  load_reinforcement?: number;
  proactive_investment?: number;
  fault_level?: number;
  reverse_power_flow?: number;
  connections?: number;
}

export interface YearlyInvestment {
  total: number;
  byDriver: InvestmentByDriver;
}

export interface Asset {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  assetType: 'substation' | 'transformer' | 'cable' | 'overhead_line' | 'switchgear';
  voltage: number;
  name?: string;
  investmentsByYear: Record<string, YearlyInvestment>;
}

export interface InvestmentData {
  generatedAt: string;
  totalAssets: number;
  assets: Asset[];
}

export interface AggregatedStats {
  totalInvestment: number;
  assetCount: number;
  byDriver: Record<string, number>;
  byAssetType: Record<string, number>;
  byVoltage: Record<string, number>;
  averageInvestmentPerAsset: number;
}

// Cache for loaded data
let cachedInvestmentData: InvestmentData | null = null;
let cachedBoundaries: Map<string, Feature<Polygon | MultiPolygon>[]> = new Map();

/**
 * Load investment data from JSON file
 */
export async function loadInvestmentData(): Promise<InvestmentData> {
  if (cachedInvestmentData) {
    return cachedInvestmentData;
  }

  try {
    const response = await fetch('/data/investments.json');
    if (!response.ok) {
      throw new Error(`Failed to load investment data: ${response.status}`);
    }
    cachedInvestmentData = await response.json();
    return cachedInvestmentData!;
  } catch (error) {
    console.error('[InvestmentAggregation] Failed to load data:', error);
    throw error;
  }
}

/**
 * Load boundary GeoJSON data
 */
export async function loadBoundaryData(
  boundaryType: 'resp' | 'gsp' | 'la'
): Promise<Feature<Polygon | MultiPolygon>[]> {
  const cacheKey = boundaryType;
  if (cachedBoundaries.has(cacheKey)) {
    return cachedBoundaries.get(cacheKey)!;
  }

  try {
    const response = await fetch(`/data/boundaries/${boundaryType}.geojson`);
    if (!response.ok) {
      throw new Error(`Failed to load ${boundaryType} boundaries: ${response.status}`);
    }
    const geojson = await response.json();
    const features = geojson.features as Feature<Polygon | MultiPolygon>[];
    cachedBoundaries.set(cacheKey, features);
    return features;
  } catch (error) {
    console.error(`[InvestmentAggregation] Failed to load ${boundaryType} boundaries:`, error);
    throw error;
  }
}

/**
 * Find boundary feature by code
 */
export async function findBoundaryByCode(
  boundaryType: 'resp' | 'gsp' | 'la',
  code: string
): Promise<Feature<Polygon | MultiPolygon> | null> {
  const boundaries = await loadBoundaryData(boundaryType);
  return boundaries.find(f => f.properties?.code === code) || null;
}

/**
 * Check if a point is inside a polygon/multipolygon
 */
function isPointInBoundary(
  point: [number, number],
  boundary: Feature<Polygon | MultiPolygon>
): boolean {
  const pt = turf.point(point);
  return turf.booleanPointInPolygon(pt, boundary);
}

/**
 * Get all assets within a boundary
 */
export async function getAssetsInBoundary(
  boundaryType: 'resp' | 'gsp' | 'la',
  boundaryCode: string
): Promise<Asset[]> {
  const [investmentData, boundary] = await Promise.all([
    loadInvestmentData(),
    findBoundaryByCode(boundaryType, boundaryCode),
  ]);

  if (!boundary) {
    console.warn(`[InvestmentAggregation] Boundary not found: ${boundaryType}/${boundaryCode}`);
    return [];
  }

  return investmentData.assets.filter(asset =>
    isPointInBoundary(asset.coordinates, boundary)
  );
}

/**
 * Aggregate investment statistics for assets within a boundary for a specific year
 */
export async function aggregateInvestmentsByBoundary(
  boundaryType: 'resp' | 'gsp' | 'la',
  boundaryCode: string,
  year: number
): Promise<AggregatedStats> {
  const assets = await getAssetsInBoundary(boundaryType, boundaryCode);
  const yearStr = String(year);

  const stats: AggregatedStats = {
    totalInvestment: 0,
    assetCount: assets.length,
    byDriver: {},
    byAssetType: {},
    byVoltage: {},
    averageInvestmentPerAsset: 0,
  };

  for (const asset of assets) {
    const yearData = asset.investmentsByYear[yearStr];
    if (!yearData) continue;

    // Total investment
    stats.totalInvestment += yearData.total;

    // By driver
    for (const [driver, amount] of Object.entries(yearData.byDriver)) {
      if (amount) {
        stats.byDriver[driver] = (stats.byDriver[driver] || 0) + amount;
      }
    }

    // By asset type
    stats.byAssetType[asset.assetType] =
      (stats.byAssetType[asset.assetType] || 0) + yearData.total;

    // By voltage
    const voltageKey = getVoltageCategory(asset.voltage);
    stats.byVoltage[voltageKey] =
      (stats.byVoltage[voltageKey] || 0) + yearData.total;
  }

  // Calculate average
  stats.averageInvestmentPerAsset =
    stats.assetCount > 0 ? stats.totalInvestment / stats.assetCount : 0;

  return stats;
}

/**
 * Get voltage category label
 */
function getVoltageCategory(voltage: number): string {
  if (voltage >= 275000) return '275kV+';
  if (voltage >= 132000) return '132kV';
  if (voltage >= 33000) return '33kV';
  if (voltage >= 11000) return '11kV';
  return 'LV';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `£${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `£${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `£${(amount / 1_000).toFixed(0)}K`;
  }
  return `£${amount.toFixed(0)}`;
}

/**
 * Get total investment across all areas for a year
 */
export async function getTotalInvestmentForYear(year: number): Promise<number> {
  const data = await loadInvestmentData();
  const yearStr = String(year);

  return data.assets.reduce((sum, asset) => {
    const yearData = asset.investmentsByYear[yearStr];
    return sum + (yearData?.total || 0);
  }, 0);
}

/**
 * Clear cached data (useful for testing or when data might have changed)
 */
export function clearCache(): void {
  cachedInvestmentData = null;
  cachedBoundaries.clear();
}
