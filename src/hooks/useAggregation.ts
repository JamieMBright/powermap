'use client';

import { useMemo } from 'react';
import type {
  AssetInvestment,
  InvestmentDriver,
  AssetType,
  BoundaryType,
} from '@/data/types';

/**
 * Aggregated statistics for a boundary
 */
export interface AggregatedStats {
  /** Total investment amount in pounds */
  totalInvestment: number;
  /** Total number of assets */
  assetCount: number;
  /** Investment broken down by driver */
  byDriver: Record<InvestmentDriver, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  /** Asset count by type */
  byAssetType: Record<AssetType, number>;
  /** Average investment per asset */
  averageInvestmentPerAsset: number;
}

/**
 * Empty aggregated stats object
 */
export const EMPTY_STATS: AggregatedStats = {
  totalInvestment: 0,
  assetCount: 0,
  byDriver: {
    asset_replacement: { amount: 0, count: 0, percentage: 0 },
    load_reinforcement: { amount: 0, count: 0, percentage: 0 },
    proactive_investment: { amount: 0, count: 0, percentage: 0 },
    fault_level: { amount: 0, count: 0, percentage: 0 },
    reverse_power_flow: { amount: 0, count: 0, percentage: 0 },
    connections: { amount: 0, count: 0, percentage: 0 },
  },
  byAssetType: {
    substation: 0,
    transformer: 0,
    cable: 0,
    overhead_line: 0,
    switchgear: 0,
  },
  averageInvestmentPerAsset: 0,
};

/**
 * Calculate aggregated statistics from an array of investments
 */
export function calculateAggregatedStats(
  investments: AssetInvestment[]
): AggregatedStats {
  if (investments.length === 0) {
    return EMPTY_STATS;
  }

  // Initialize accumulators
  const byDriver: AggregatedStats['byDriver'] = {
    asset_replacement: { amount: 0, count: 0, percentage: 0 },
    load_reinforcement: { amount: 0, count: 0, percentage: 0 },
    proactive_investment: { amount: 0, count: 0, percentage: 0 },
    fault_level: { amount: 0, count: 0, percentage: 0 },
    reverse_power_flow: { amount: 0, count: 0, percentage: 0 },
    connections: { amount: 0, count: 0, percentage: 0 },
  };

  const byAssetType: AggregatedStats['byAssetType'] = {
    substation: 0,
    transformer: 0,
    cable: 0,
    overhead_line: 0,
    switchgear: 0,
  };

  let totalInvestment = 0;

  // Aggregate data
  for (const investment of investments) {
    const { amount, driver, type } = investment.investment;

    totalInvestment += amount;
    byDriver[driver].amount += amount;
    byDriver[driver].count += 1;
    byAssetType[type] += 1;
  }

  // Calculate percentages
  if (totalInvestment > 0) {
    for (const driver of Object.keys(byDriver) as InvestmentDriver[]) {
      byDriver[driver].percentage = (byDriver[driver].amount / totalInvestment) * 100;
    }
  }

  const assetCount = investments.length;
  const averageInvestmentPerAsset = assetCount > 0 ? totalInvestment / assetCount : 0;

  return {
    totalInvestment,
    assetCount,
    byDriver,
    byAssetType,
    averageInvestmentPerAsset,
  };
}

/**
 * Filter investments by boundary
 */
export function filterInvestmentsByBoundary(
  investments: AssetInvestment[],
  boundaryType: BoundaryType,
  boundaryCode: string
): AssetInvestment[] {
  return investments.filter(inv => inv.boundaries[boundaryType] === boundaryCode);
}

/**
 * Filter investments by year
 */
export function filterInvestmentsByYear(
  investments: AssetInvestment[],
  year: number
): AssetInvestment[] {
  return investments.filter(inv => inv.year === year);
}

/**
 * Filter investments by year range (inclusive)
 */
export function filterInvestmentsByYearRange(
  investments: AssetInvestment[],
  startYear: number,
  endYear: number
): AssetInvestment[] {
  return investments.filter(inv => inv.year >= startYear && inv.year <= endYear);
}

interface UseAggregationOptions {
  /** Boundary type to filter by */
  boundaryType?: BoundaryType;
  /** Boundary code to filter by */
  boundaryCode?: string;
  /** Year to filter by (if not set, aggregates all years) */
  year?: number;
  /** Year range start (alternative to single year) */
  startYear?: number;
  /** Year range end (alternative to single year) */
  endYear?: number;
}

/**
 * Hook for calculating aggregated statistics from investment data
 * Memoized for performance
 */
export function useAggregation(
  investments: AssetInvestment[],
  options: UseAggregationOptions = {}
): AggregatedStats {
  const { boundaryType, boundaryCode, year, startYear, endYear } = options;

  return useMemo(() => {
    let filtered = investments;

    // Filter by boundary if specified
    if (boundaryType && boundaryCode) {
      filtered = filterInvestmentsByBoundary(filtered, boundaryType, boundaryCode);
    }

    // Filter by year or year range
    if (year !== undefined) {
      filtered = filterInvestmentsByYear(filtered, year);
    } else if (startYear !== undefined && endYear !== undefined) {
      filtered = filterInvestmentsByYearRange(filtered, startYear, endYear);
    }

    return calculateAggregatedStats(filtered);
  }, [investments, boundaryType, boundaryCode, year, startYear, endYear]);
}

/**
 * Hook for calculating stats with comparison to previous period
 */
export function useAggregationWithComparison(
  investments: AssetInvestment[],
  options: UseAggregationOptions & { compareToPreviousYear?: boolean } = {}
): {
  current: AggregatedStats;
  previous: AggregatedStats | null;
  change: {
    totalInvestment: number;
    assetCount: number;
  } | null;
} {
  const { compareToPreviousYear = false, year, ...rest } = options;

  const current = useAggregation(investments, { ...rest, year });

  const previous = useMemo(() => {
    if (!compareToPreviousYear || year === undefined) {
      return null;
    }
    return calculateAggregatedStats(
      filterInvestmentsByYear(
        rest.boundaryType && rest.boundaryCode
          ? filterInvestmentsByBoundary(investments, rest.boundaryType, rest.boundaryCode)
          : investments,
        year - 1
      )
    );
  }, [investments, compareToPreviousYear, year, rest.boundaryType, rest.boundaryCode]);

  const change = useMemo(() => {
    if (!previous) return null;
    return {
      totalInvestment: current.totalInvestment - previous.totalInvestment,
      assetCount: current.assetCount - previous.assetCount,
    };
  }, [current, previous]);

  return { current, previous, change };
}

export { useAggregation as default };
