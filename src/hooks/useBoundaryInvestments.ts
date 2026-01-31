'use client';

import { useState, useEffect } from 'react';
import type { BoundaryType } from '@/data/types';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import * as turf from '@turf/turf';
import { useInvestmentData } from './useInvestmentData';

export type DriverSelection = 'all' | string;

export interface BoundaryInvestmentStats {
  /** Investment amount per boundary code */
  byCode: Map<string, number>;
  /** Minimum investment amount */
  min: number;
  /** Maximum investment amount */
  max: number;
  /** Total investment across all boundaries */
  total: number;
  /** Number of boundaries with investment data */
  count: number;
}

interface UseBoundaryInvestmentsOptions {
  /** Boundary type to aggregate by */
  boundaryType: BoundaryType | null;
  /** Selected driver filter ('all' or specific driver key) */
  selectedDriver: DriverSelection;
  /** Whether to enable the hook */
  enabled?: boolean;
}

// Cache for loaded boundary data
const boundaryCache = new Map<string, Feature<Polygon | MultiPolygon>[]>();

/**
 * Load boundary GeoJSON data
 */
async function loadBoundaryGeoJSON(
  boundaryType: BoundaryType
): Promise<Feature<Polygon | MultiPolygon>[]> {
  if (boundaryCache.has(boundaryType)) {
    return boundaryCache.get(boundaryType)!;
  }

  const response = await fetch(`/data/boundaries/${boundaryType}.geojson`);
  if (!response.ok) {
    throw new Error(`Failed to load ${boundaryType} boundaries`);
  }
  const geojson = await response.json();
  const features = geojson.features as Feature<Polygon | MultiPolygon>[];
  boundaryCache.set(boundaryType, features);
  return features;
}

/**
 * Find which boundary a point is in using spatial matching
 */
function findBoundaryForPoint(
  lng: number,
  lat: number,
  boundaries: Feature<Polygon | MultiPolygon>[]
): string | null {
  const point = turf.point([lng, lat]);

  for (const boundary of boundaries) {
    try {
      if (turf.booleanPointInPolygon(point, boundary)) {
        return boundary.properties?.code || null;
      }
    } catch {
      // Skip invalid geometries
      continue;
    }
  }
  return null;
}

/**
 * Hook to calculate investment amounts aggregated by boundary using spatial matching
 */
export function useBoundaryInvestments(
  year: number,
  options: UseBoundaryInvestmentsOptions
): {
  stats: BoundaryInvestmentStats | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { boundaryType, selectedDriver, enabled = true } = options;
  const [stats, setStats] = useState<BoundaryInvestmentStats | null>(null);
  const [boundaryError, setBoundaryError] = useState<Error | null>(null);

  const { investments, isLoading, error: investmentError } = useInvestmentData(year, {
    enabled: enabled && boundaryType !== null,
  });

  // Calculate investments by boundary using spatial matching
  useEffect(() => {
    if (!boundaryType || !investments.length) {
      setStats(null);
      return;
    }

    let cancelled = false;

    async function calculateStats() {
      try {
        if (!boundaryType) return;

        // Load boundary data
        const boundaries = await loadBoundaryGeoJSON(boundaryType);

        if (cancelled) return;

        const byCode = new Map<string, number>();

        // For each investment, find which boundary it's in
        investments.forEach((investment) => {
          // Filter by driver if not 'all'
          if (selectedDriver !== 'all' && investment.investment.driver !== selectedDriver) {
            return;
          }

          // Use spatial matching to find the boundary
          const boundaryCode = findBoundaryForPoint(
            investment.location.lng,
            investment.location.lat,
            boundaries
          );

          if (!boundaryCode) return;

          const currentAmount = byCode.get(boundaryCode) || 0;
          byCode.set(boundaryCode, currentAmount + investment.investment.amount);
        });

        if (cancelled) return;

        // Calculate stats
        const amounts = Array.from(byCode.values());
        const min = amounts.length > 0 ? Math.min(...amounts) : 0;
        const max = amounts.length > 0 ? Math.max(...amounts) : 0;
        const total = amounts.reduce((sum, amt) => sum + amt, 0);

        setStats({
          byCode,
          min,
          max,
          total,
          count: byCode.size,
        });
        setBoundaryError(null);
      } catch (err) {
        if (!cancelled) {
          console.error('[useBoundaryInvestments] Error:', err);
          setBoundaryError(err instanceof Error ? err : new Error('Failed to calculate stats'));
          setStats(null);
        }
      }
    }

    calculateStats();

    return () => {
      cancelled = true;
    };
  }, [investments, boundaryType, selectedDriver]);

  return {
    stats,
    isLoading,
    error: investmentError || boundaryError,
  };
}

export default useBoundaryInvestments;
