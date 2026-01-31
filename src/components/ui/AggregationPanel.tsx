'use client';

import { useState, useEffect } from 'react';
import type { BoundaryType, InvestmentDriver, AssetType } from '@/data/types';
import type { AggregatedStats } from '@/contexts/BoundaryContext';
import { StatCard } from './StatCard';
import { getDriverConfig } from './InvestmentCard';
import { BOUNDARY_CONFIGS } from '@/lib/boundaries';

interface SelectedBoundary {
  type: BoundaryType;
  code: string;
  name: string;
}

interface AggregationPanelProps {
  /** Selected boundary info */
  selectedBoundary: SelectedBoundary | null;
  /** Aggregated statistics */
  stats: AggregatedStats;
  /** Current year for display */
  year: number;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Whether the panel is loading */
  isLoading?: boolean;
}

// Asset type display names
const ASSET_TYPE_NAMES: Record<string, string> = {
  substation: 'Substations',
  transformer: 'Transformers',
  cable: 'Cables',
  overhead_line: 'Overhead Lines',
  switchgear: 'Switchgear',
};

// Driver display names
const DRIVER_NAMES: Record<string, string> = {
  asset_replacement: 'Asset Replacement',
  load_reinforcement: 'Load Reinforcement',
  proactive_investment: 'Proactive Investment',
  fault_level: 'Fault Level',
  reverse_power_flow: 'Reverse Power Flow',
  connections: 'Connections',
};

/**
 * Format currency value with appropriate suffix
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `£${(amount / 1_000_000_000).toFixed(2)}bn`;
  }
  if (amount >= 1_000_000) {
    return `£${(amount / 1_000_000).toFixed(2)}m`;
  }
  if (amount >= 1_000) {
    return `£${(amount / 1_000).toFixed(1)}k`;
  }
  return `£${amount.toLocaleString('en-GB')}`;
}

/**
 * Simple CSS-based donut chart for driver breakdown
 */
function DriverDonutChart({
  byDriver,
  totalInvestment,
}: {
  byDriver: Record<string, number>;
  totalInvestment: number;
}) {
  // Sort drivers by amount descending
  const sortedDrivers = Object.entries(byDriver)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedDrivers.length === 0 || totalInvestment === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No investment data
      </div>
    );
  }

  // Calculate conic gradient segments
  let currentAngle = 0;
  const segments: string[] = [];

  for (const [driver, amount] of sortedDrivers) {
    const config = getDriverConfig(driver as InvestmentDriver);
    const angle = (amount / totalInvestment) * 360;
    segments.push(`${config.color} ${currentAngle}deg ${currentAngle + angle}deg`);
    currentAngle += angle;
  }

  return (
    <div className="flex items-center gap-4">
      {/* Donut chart */}
      <div
        className="w-24 h-24 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${segments.join(', ')})`,
          maskImage: 'radial-gradient(circle, transparent 40%, black 41%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 40%, black 41%)',
        }}
      />

      {/* Legend */}
      <div className="flex-1 space-y-1">
        {sortedDrivers.slice(0, 4).map(([driver, amount]) => {
          const config = getDriverConfig(driver as InvestmentDriver);
          const percentage = (amount / totalInvestment) * 100;
          return (
            <div key={driver} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className="flex-1 text-xs text-gray-600 truncate">
                {DRIVER_NAMES[driver] || driver}
              </span>
              <span className="text-xs font-medium text-gray-900 tabular-nums">
                {percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
        {sortedDrivers.length > 4 && (
          <div className="text-xs text-gray-400">
            +{sortedDrivers.length - 4} more
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Asset type breakdown as horizontal bars
 */
function AssetTypeBreakdown({
  byAssetType,
  totalInvestment,
}: {
  byAssetType: Record<string, number>;
  totalInvestment: number;
}) {
  const sortedTypes = Object.entries(byAssetType)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedTypes.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-2">
        No assets
      </div>
    );
  }

  const maxAmount = Math.max(...sortedTypes.map(([_, amount]) => amount));

  return (
    <div className="space-y-2">
      {sortedTypes.map(([type, amount]) => {
        const percentage = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;
        const barWidth = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

        return (
          <div key={type}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{ASSET_TYPE_NAMES[type] || type}</span>
              <span className="text-gray-900 font-medium tabular-nums">
                {formatCurrency(amount)} <span className="text-gray-400">({percentage.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Driver breakdown cards
 */
function DriverBreakdown({
  byDriver,
  totalInvestment,
}: {
  byDriver: Record<string, number>;
  totalInvestment: number;
}) {
  const sortedDrivers = Object.entries(byDriver)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedDrivers.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No investments for this year
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedDrivers.map(([driver, amount]) => {
        const config = getDriverConfig(driver as InvestmentDriver);
        const percentage = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;

        return (
          <div
            key={driver}
            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {DRIVER_NAMES[driver] || driver}
              </div>
              <div className="text-xs text-gray-500">
                {percentage.toFixed(1)}% of total
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(amount)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * AggregationPanel - Main panel component for displaying aggregated investment data
 * Responsive: sidebar on desktop, slide-up panel on mobile
 */
export function AggregationPanel({
  selectedBoundary,
  stats,
  year,
  onClose,
  isLoading = false,
}: AggregationPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animate in when boundary is selected
  useEffect(() => {
    if (selectedBoundary) {
      // Small delay for smooth animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [selectedBoundary]);

  if (!selectedBoundary) {
    return null;
  }

  const boundaryConfig = BOUNDARY_CONFIGS[selectedBoundary.type];

  const content = (
    <>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-3 border-b border-gray-200"
        style={{ backgroundColor: `${boundaryConfig.colors.fill}15` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: boundaryConfig.colors.fill }}
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {boundaryConfig.name}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {selectedBoundary.name}
          </h2>
          <p className="text-sm text-gray-500">
            Code: {selectedBoundary.code}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 -mt-1 rounded-full hover:bg-white/50 active:bg-white/70 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto">
          {/* Year indicator */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-sm text-gray-600">Investment Year: </span>
            <span className="text-sm font-bold text-orange-600">{year}</span>
          </div>

          {/* Summary stats */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <StatCard
              label="Total Investment"
              value={formatCurrency(stats.totalInvestment)}
              color="orange"
              size="md"
            />
            <StatCard
              label="Assets"
              value={stats.assetCount.toString()}
              color="emerald"
              size="md"
            />
          </div>

          {/* Investment breakdown by driver */}
          <div className="px-4 pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Investment by Driver
            </h3>

            {/* Donut chart */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <DriverDonutChart
                byDriver={stats.byDriver}
                totalInvestment={stats.totalInvestment}
              />
            </div>

            {/* Investment cards */}
            <DriverBreakdown
              byDriver={stats.byDriver}
              totalInvestment={stats.totalInvestment}
            />
          </div>

          {/* Asset type breakdown */}
          <div className="px-4 pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Investment by Asset Type
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <AssetTypeBreakdown
                byAssetType={stats.byAssetType}
                totalInvestment={stats.totalInvestment}
              />
            </div>
          </div>

          {/* Average investment */}
          {stats.assetCount > 0 && (
            <div className="px-4 pb-4">
              <StatCard
                label="Average Investment per Asset"
                value={formatCurrency(stats.averageInvestmentPerAsset)}
                color="amber"
                size="sm"
              />
            </div>
          )}
        </div>
      )}
    </>
  );

  // Mobile: slide-up panel
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`
            fixed inset-0 bg-black/30 z-40 transition-opacity duration-200
            ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={`
            fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl
            flex flex-col max-h-[80vh] transition-transform duration-200 ease-out
            ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {content}

          {/* Safe area padding for iOS */}
          <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </>
    );
  }

  // Desktop: sidebar
  return (
    <div
      className={`
        fixed top-14 right-0 bottom-0 z-30 w-80 bg-white shadow-xl border-l border-gray-200
        flex flex-col transition-transform duration-200 ease-out
        ${isVisible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {content}
    </div>
  );
}

export { AggregationPanel as default };
