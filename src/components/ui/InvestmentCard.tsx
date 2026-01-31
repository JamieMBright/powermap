'use client';

import type { InvestmentDriver, AssetType } from '@/data/types';

interface InvestmentCardProps {
  /** Investment driver type */
  driver: InvestmentDriver;
  /** Investment amount in pounds */
  amount: number;
  /** Number of assets for this driver */
  assetCount: number;
  /** Optional percentage of total investment */
  percentage?: number;
  /** Whether the card is compact */
  compact?: boolean;
}

// Driver display configuration
const DRIVER_CONFIG: Record<InvestmentDriver, {
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  asset_replacement: {
    name: 'Asset Replacement',
    shortName: 'Replacement',
    color: '#ef4444',
    bgColor: 'bg-red-50',
    description: 'End-of-life asset replacement',
  },
  load_reinforcement: {
    name: 'Load Reinforcement',
    shortName: 'Load',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    description: 'Capacity upgrades for demand growth',
  },
  proactive_investment: {
    name: 'Proactive Investment',
    shortName: 'Proactive',
    color: '#10b981',
    bgColor: 'bg-emerald-50',
    description: 'Forward-looking investment',
  },
  fault_level: {
    name: 'Fault Level',
    shortName: 'Fault',
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    description: 'Fault level management',
  },
  reverse_power_flow: {
    name: 'Reverse Power Flow',
    shortName: 'Reverse Flow',
    color: '#8b5cf6',
    bgColor: 'bg-violet-50',
    description: 'Managing power flowing back to grid',
  },
  connections: {
    name: 'Connections',
    shortName: 'Connections',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50',
    description: 'New customer connections',
  },
};

/**
 * Format currency value
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}bn`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}m`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}k`;
  }
  return amount.toLocaleString('en-GB');
}

/**
 * InvestmentCard - Display individual investment summary by driver
 * Shows amount, percentage bar, and asset count
 */
export function InvestmentCard({
  driver,
  amount,
  assetCount,
  percentage = 0,
  compact = false,
}: InvestmentCardProps) {
  const config = DRIVER_CONFIG[driver];

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <span className="flex-1 text-xs text-gray-700 truncate">
          {config.shortName}
        </span>
        <span className="text-xs font-medium text-gray-900">
          {formatCurrency(amount)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} rounded-lg p-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm font-medium text-gray-800 truncate">
            {config.name}
          </span>
        </div>
        <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">
          {formatCurrency(amount)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-white/60 rounded-full overflow-hidden mb-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{
            backgroundColor: config.color,
            width: `${Math.min(100, percentage)}%`,
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{assetCount} asset{assetCount !== 1 ? 's' : ''}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/**
 * Get driver configuration for external use
 */
export function getDriverConfig(driver: InvestmentDriver) {
  return DRIVER_CONFIG[driver];
}

/**
 * Get all driver configurations
 */
export function getAllDriverConfigs() {
  return DRIVER_CONFIG;
}

export { InvestmentCard as default };
