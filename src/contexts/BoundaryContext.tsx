'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { BoundaryType } from '@/data/types';
import {
  aggregateInvestmentsByBoundary,
  type AggregatedStats as RealAggregatedStats,
} from '@/lib/investmentAggregation';

/**
 * Selected boundary information
 */
export interface SelectedBoundary {
  type: BoundaryType;
  code: string;
  name: string;
}

/**
 * Aggregated statistics for display
 */
export interface AggregatedStats {
  totalInvestment: number;
  assetCount: number;
  byDriver: Record<string, number>;
  byAssetType: Record<string, number>;
  averageInvestmentPerAsset: number;
}

const EMPTY_STATS: AggregatedStats = {
  totalInvestment: 0,
  assetCount: 0,
  byDriver: {},
  byAssetType: {},
  averageInvestmentPerAsset: 0,
};

/**
 * Boundary context value interface
 */
interface BoundaryContextValue {
  /** Currently selected boundary */
  selectedBoundary: SelectedBoundary | null;
  /** Set the selected boundary */
  selectBoundary: (boundary: SelectedBoundary | null) => void;
  /** Clear the selected boundary */
  clearBoundary: () => void;
  /** Current year filter */
  year: number;
  /** Set year filter */
  setYear: (year: number) => void;
  /** Aggregated stats for current selection */
  aggregatedStats: AggregatedStats;
  /** Whether data is currently loading */
  isLoading: boolean;
}

// Create context with default values
const BoundaryContext = createContext<BoundaryContextValue | null>(null);

/**
 * Provider props
 */
interface BoundaryProviderProps {
  children: ReactNode;
  /** Initial year (defaults to 2025) */
  initialYear?: number;
}

/**
 * BoundaryProvider - Provides boundary selection state to the component tree
 */
export function BoundaryProvider({
  children,
  initialYear = 2025,
}: BoundaryProviderProps) {
  const [selectedBoundary, setSelectedBoundary] = useState<SelectedBoundary | null>(null);
  const [year, setYear] = useState(initialYear);
  const [isLoading, setIsLoading] = useState(false);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats>(EMPTY_STATS);

  const selectBoundary = useCallback((boundary: SelectedBoundary | null) => {
    setSelectedBoundary(boundary);
  }, []);

  const clearBoundary = useCallback(() => {
    setSelectedBoundary(null);
    setAggregatedStats(EMPTY_STATS);
  }, []);

  // Fetch and aggregate data when boundary or year changes
  useEffect(() => {
    if (!selectedBoundary) {
      setAggregatedStats(EMPTY_STATS);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    aggregateInvestmentsByBoundary(
      selectedBoundary.type as 'resp' | 'gsp' | 'la',
      selectedBoundary.code,
      year
    )
      .then((stats: RealAggregatedStats) => {
        if (cancelled) return;
        setAggregatedStats({
          totalInvestment: stats.totalInvestment,
          assetCount: stats.assetCount,
          byDriver: stats.byDriver,
          byAssetType: stats.byAssetType,
          averageInvestmentPerAsset: stats.averageInvestmentPerAsset,
        });
      })
      .catch((error) => {
        console.error('[BoundaryContext] Failed to aggregate:', error);
        if (!cancelled) {
          setAggregatedStats(EMPTY_STATS);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBoundary, year]);

  const value = useMemo<BoundaryContextValue>(() => ({
    selectedBoundary,
    selectBoundary,
    clearBoundary,
    year,
    setYear,
    aggregatedStats,
    isLoading,
  }), [
    selectedBoundary,
    selectBoundary,
    clearBoundary,
    year,
    aggregatedStats,
    isLoading,
  ]);

  return (
    <BoundaryContext.Provider value={value}>
      {children}
    </BoundaryContext.Provider>
  );
}

/**
 * Hook to access boundary context
 * @throws Error if used outside of BoundaryProvider
 */
export function useBoundaryContext(): BoundaryContextValue {
  const context = useContext(BoundaryContext);
  if (!context) {
    throw new Error('useBoundaryContext must be used within a BoundaryProvider');
  }
  return context;
}

/**
 * Hook to access selected boundary (convenience hook)
 */
export function useSelectedBoundary(): {
  selectedBoundary: SelectedBoundary | null;
  selectBoundary: (boundary: SelectedBoundary | null) => void;
  clearBoundary: () => void;
} {
  const { selectedBoundary, selectBoundary, clearBoundary } = useBoundaryContext();
  return { selectedBoundary, selectBoundary, clearBoundary };
}

/**
 * Hook to access aggregated stats (convenience hook)
 */
export function useAggregatedStats(): AggregatedStats {
  const { aggregatedStats } = useBoundaryContext();
  return aggregatedStats;
}

export { BoundaryContext, EMPTY_STATS };
