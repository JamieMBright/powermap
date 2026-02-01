'use client';

import { useState, useEffect } from 'react';
import type { BoundaryType, InvestmentDriver } from '@/data/types';

// Investment data by year and driver for a specific boundary
export interface BoundaryTimeSeriesData {
  year: number;
  asset_replacement: number;
  load_reinforcement: number;
  proactive_investment: number;
  fault_level: number;
  reverse_power_flow: number;
  connections: number;
  total: number;
}

interface UseBoundaryTimeSeriesOptions {
  boundaryType: BoundaryType;
  boundaryCode: string;
  enabled?: boolean;
}

interface InvestmentByAreaData {
  metadata: {
    years: { start: number; end: number };
    investmentDrivers: string[];
  };
  byArea: Record<string, {
    name: string;
    type: string;
    data: Record<string, Record<string, number>>;
  }>;
}

// Cache for loaded investment data
let investmentByAreaCache: InvestmentByAreaData | null = null;

async function loadInvestmentByAreaData(): Promise<InvestmentByAreaData> {
  if (investmentByAreaCache) {
    return investmentByAreaCache;
  }

  const response = await fetch('/data/investment-by-area.json');
  if (!response.ok) {
    throw new Error('Failed to load investment by area data');
  }
  investmentByAreaCache = await response.json();
  return investmentByAreaCache!;
}

const DRIVERS: InvestmentDriver[] = [
  'asset_replacement',
  'load_reinforcement',
  'proactive_investment',
  'fault_level',
  'reverse_power_flow',
  'connections',
];

const YEARS = Array.from({ length: 26 }, (_, i) => 2025 + i);

/**
 * Hook to get time series investment data for a specific boundary
 * Returns investment amounts by year and driver from 2025-2050
 */
export function useBoundaryTimeSeries(
  options: UseBoundaryTimeSeriesOptions
): {
  data: BoundaryTimeSeriesData[] | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { boundaryType, boundaryCode, enabled = true } = options;
  const [data, setData] = useState<BoundaryTimeSeriesData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !boundaryCode) {
      setData(null);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const investmentData = await loadInvestmentByAreaData();

        if (cancelled) return;

        const areaData = investmentData.byArea[boundaryCode];

        if (!areaData) {
          // No data for this boundary - return zeros
          const emptyData: BoundaryTimeSeriesData[] = YEARS.map(year => ({
            year,
            asset_replacement: 0,
            load_reinforcement: 0,
            proactive_investment: 0,
            fault_level: 0,
            reverse_power_flow: 0,
            connections: 0,
            total: 0,
          }));
          setData(emptyData);
          return;
        }

        // Transform the data into time series format
        const timeSeriesData: BoundaryTimeSeriesData[] = YEARS.map(year => {
          const yearData = areaData.data[year] || {};

          const entry: BoundaryTimeSeriesData = {
            year,
            asset_replacement: yearData.asset_replacement || 0,
            load_reinforcement: yearData.load_reinforcement || 0,
            proactive_investment: yearData.proactive_investment || 0,
            fault_level: yearData.fault_level || 0,
            reverse_power_flow: yearData.reverse_power_flow || 0,
            connections: yearData.connections || 0,
            total: 0,
          };

          // Calculate total
          entry.total = DRIVERS.reduce((sum, driver) => sum + entry[driver], 0);

          return entry;
        });

        if (cancelled) return;

        setData(timeSeriesData);
      } catch (err) {
        if (!cancelled) {
          console.error('[useBoundaryTimeSeries] Error:', err);
          setError(err instanceof Error ? err : new Error('Failed to load time series data'));
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [boundaryCode, boundaryType, enabled]);

  return { data, isLoading, error };
}

export default useBoundaryTimeSeries;
