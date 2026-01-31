'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { BoundaryType, AssetInvestment } from '@/data/types';
import { useAggregation, EMPTY_STATS, type AggregatedStats } from '@/hooks/useAggregation';

/**
 * Selected boundary information
 */
export interface SelectedBoundary {
  type: BoundaryType;
  code: string;
  name: string;
}

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
  /** Current investment data */
  investments: AssetInvestment[];
  /** Set investment data */
  setInvestments: (investments: AssetInvestment[]) => void;
  /** Current year filter */
  year: number;
  /** Set year filter */
  setYear: (year: number) => void;
  /** Aggregated stats for current selection */
  aggregatedStats: AggregatedStats;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
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
  /** Initial investment data */
  initialInvestments?: AssetInvestment[];
}

/**
 * BoundaryProvider - Provides boundary selection state to the component tree
 */
export function BoundaryProvider({
  children,
  initialYear = 2025,
  initialInvestments = [],
}: BoundaryProviderProps) {
  const [selectedBoundary, setSelectedBoundary] = useState<SelectedBoundary | null>(null);
  const [investments, setInvestments] = useState<AssetInvestment[]>(initialInvestments);
  const [year, setYear] = useState(initialYear);
  const [isLoading, setIsLoading] = useState(false);

  const selectBoundary = useCallback((boundary: SelectedBoundary | null) => {
    setSelectedBoundary(boundary);
  }, []);

  const clearBoundary = useCallback(() => {
    setSelectedBoundary(null);
  }, []);

  // Calculate aggregated stats based on current selection
  const aggregatedStats = useAggregation(investments, {
    boundaryType: selectedBoundary?.type,
    boundaryCode: selectedBoundary?.code,
    year,
  });

  const value = useMemo<BoundaryContextValue>(() => ({
    selectedBoundary,
    selectBoundary,
    clearBoundary,
    investments,
    setInvestments,
    year,
    setYear,
    aggregatedStats,
    isLoading,
    setIsLoading,
  }), [
    selectedBoundary,
    selectBoundary,
    clearBoundary,
    investments,
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

export { BoundaryContext };
