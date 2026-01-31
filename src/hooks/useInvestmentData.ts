'use client';

/**
 * React hook for fetching and caching investment data by year
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AssetInvestment, BoundaryType } from '@/data/types';

/**
 * Investment driver metadata from the metadata file
 */
export interface InvestmentDriverMeta {
  name: string;
  color: string;
  description: string;
}

/**
 * Investment drivers metadata mapping
 */
export interface InvestmentDriversMetadata {
  drivers: Record<string, InvestmentDriverMeta>;
}

/**
 * Investment data file structure
 */
interface InvestmentDataFile {
  year: number;
  investments: AssetInvestment[];
}

/**
 * Hook state for investment data
 */
export interface UseInvestmentDataState {
  investments: AssetInvestment[];
  isLoading: boolean;
  error: Error | null;
  totalInvestment: number;
}

/**
 * Hook options
 */
export interface UseInvestmentDataOptions {
  /** Boundary type to filter by */
  boundaryType?: BoundaryType;
  /** Boundary code to filter by */
  boundaryCode?: string;
  /** Whether to enable the hook */
  enabled?: boolean;
}

// Cache for loaded investment data
const investmentDataCache = new Map<number, AssetInvestment[]>();

// Cache for drivers metadata
let driversMetadataCache: InvestmentDriversMetadata | null = null;

/**
 * Available years with investment data
 */
export const INVESTMENT_YEARS = [2025, 2030, 2035, 2040, 2045, 2050] as const;
export type InvestmentYear = (typeof INVESTMENT_YEARS)[number];

/**
 * Check if a year has investment data available
 */
export function isInvestmentYear(year: number): year is InvestmentYear {
  return INVESTMENT_YEARS.includes(year as InvestmentYear);
}

/**
 * Get the closest investment year to the given year
 */
export function getClosestInvestmentYear(year: number): InvestmentYear {
  // Find the closest year that's less than or equal to the target
  const closestYear = INVESTMENT_YEARS.reduce((closest, investmentYear) => {
    if (investmentYear <= year && investmentYear > closest) {
      return investmentYear;
    }
    return closest;
  }, INVESTMENT_YEARS[0]);

  return closestYear;
}

/**
 * Fetch investment data for a specific year
 */
async function fetchInvestmentData(year: number): Promise<AssetInvestment[]> {
  // Check cache first
  if (investmentDataCache.has(year)) {
    return investmentDataCache.get(year)!;
  }

  // Find the closest investment year for fetching
  const investmentYear = isInvestmentYear(year) ? year : getClosestInvestmentYear(year);

  // Check cache for the actual investment year
  if (investmentDataCache.has(investmentYear)) {
    return investmentDataCache.get(investmentYear)!;
  }

  const response = await fetch(`/data/assets/${investmentYear}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load investment data for ${investmentYear}`);
  }

  const data: InvestmentDataFile = await response.json();

  // Cache the result
  investmentDataCache.set(investmentYear, data.investments);

  return data.investments;
}

/**
 * Fetch investment drivers metadata
 */
export async function fetchInvestmentDriversMetadata(): Promise<InvestmentDriversMetadata> {
  if (driversMetadataCache) {
    return driversMetadataCache;
  }

  const response = await fetch('/data/metadata/investment-drivers.json');
  if (!response.ok) {
    throw new Error('Failed to load investment drivers metadata');
  }

  const data: InvestmentDriversMetadata = await response.json();
  driversMetadataCache = data;

  return data;
}

/**
 * Hook for fetching investment drivers metadata
 */
export function useInvestmentDrivers(): {
  drivers: InvestmentDriversMetadata | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [drivers, setDrivers] = useState<InvestmentDriversMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDrivers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchInvestmentDriversMetadata();
        if (!cancelled) {
          setDrivers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadDrivers();

    return () => {
      cancelled = true;
    };
  }, []);

  return { drivers, isLoading, error };
}

/**
 * Filter investments by boundary
 */
function filterByBoundary(
  investments: AssetInvestment[],
  boundaryType?: BoundaryType,
  boundaryCode?: string
): AssetInvestment[] {
  if (!boundaryType || !boundaryCode) {
    return investments;
  }

  return investments.filter((investment) => {
    const boundaryValue = investment.boundaries[boundaryType];
    return boundaryValue === boundaryCode;
  });
}

/**
 * Calculate total investment amount
 */
function calculateTotalInvestment(investments: AssetInvestment[]): number {
  return investments.reduce((total, inv) => total + inv.investment.amount, 0);
}

/**
 * Hook for fetching and filtering investment data by year
 */
export function useInvestmentData(
  year: number,
  options: UseInvestmentDataOptions = {}
): UseInvestmentDataState & {
  refetch: () => Promise<void>;
} {
  const { boundaryType, boundaryCode, enabled = true } = options;

  const [allInvestments, setAllInvestments] = useState<AssetInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchInvestmentData(year);
      setAllInvestments(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [year, enabled]);

  // Fetch on mount and when year changes
  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Filter investments based on boundary selection
  const filteredInvestments = useMemo(() => {
    return filterByBoundary(allInvestments, boundaryType, boundaryCode);
  }, [allInvestments, boundaryType, boundaryCode]);

  // Calculate total investment
  const totalInvestment = useMemo(() => {
    return calculateTotalInvestment(filteredInvestments);
  }, [filteredInvestments]);

  return {
    investments: filteredInvestments,
    isLoading,
    error,
    totalInvestment,
    refetch: fetchData,
  };
}

/**
 * Clear the investment data cache
 */
export function clearInvestmentCache(): void {
  investmentDataCache.clear();
  driversMetadataCache = null;
}

/**
 * Preload investment data for specified years
 */
export async function preloadInvestmentData(years: number[]): Promise<void> {
  await Promise.all(years.map((year) => fetchInvestmentData(year)));
}

export { useInvestmentData as default };
