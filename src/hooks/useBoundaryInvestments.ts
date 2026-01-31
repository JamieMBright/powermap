'use client';

import { useState, useEffect, useMemo } from 'react';
import type { BoundaryType } from '@/data/types';
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

/**
 * Hook to calculate investment amounts aggregated by boundary
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

  const { investments, isLoading, error } = useInvestmentData(year, {
    enabled: enabled && boundaryType !== null,
  });

  // Calculate investments by boundary
  useEffect(() => {
    if (!boundaryType || !investments.length) {
      setStats(null);
      return;
    }

    const byCode = new Map<string, number>();

    investments.forEach((investment) => {
      // Filter by driver if not 'all'
      if (selectedDriver !== 'all' && investment.investment.driver !== selectedDriver) {
        return;
      }

      // Get the boundary code for this investment
      const boundaryCode = investment.boundaries[boundaryType];
      if (!boundaryCode) return;

      const currentAmount = byCode.get(boundaryCode) || 0;
      byCode.set(boundaryCode, currentAmount + investment.investment.amount);
    });

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
  }, [investments, boundaryType, selectedDriver]);

  return {
    stats,
    isLoading,
    error,
  };
}

export default useBoundaryInvestments;
