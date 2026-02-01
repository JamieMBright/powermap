'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { BoundaryTimeSeriesData } from '@/hooks/useBoundaryTimeSeries';

// Driver colors matching the investment layer colors
const DRIVER_COLORS: Record<string, string> = {
  asset_replacement: '#3B82F6',    // Blue
  load_reinforcement: '#22C55E',   // Green
  proactive_investment: '#8B5CF6', // Purple
  fault_level: '#F59E0B',          // Amber
  reverse_power_flow: '#EF4444',   // Red
  connections: '#06B6D4',          // Cyan
};

const DRIVER_NAMES: Record<string, string> = {
  asset_replacement: 'Asset Replacement',
  load_reinforcement: 'Load Reinforcement',
  proactive_investment: 'Proactive',
  fault_level: 'Fault Level',
  reverse_power_flow: 'Reverse Power',
  connections: 'Connections',
};

interface BoundaryInvestmentChartProps {
  data: BoundaryTimeSeriesData[];
  compact?: boolean;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `£${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}K`;
  }
  return `£${value.toFixed(0)}`;
}

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs">
      <div className="font-semibold text-gray-900 mb-1">{label}</div>
      <div className="space-y-0.5">
        {payload
          .filter(item => item.value > 0)
          .map(item => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{DRIVER_NAMES[item.name] || item.name}:</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
            </div>
          ))}
      </div>
      <div className="border-t border-gray-200 mt-1 pt-1 font-semibold text-gray-900">
        Total: {formatCurrency(total)}
      </div>
    </div>
  );
}

/**
 * Stacked area chart showing investment over time by driver
 */
export function BoundaryInvestmentChart({ data, compact = false }: BoundaryInvestmentChartProps) {
  // Sample data for display (show every 5 years if compact)
  const chartData = useMemo(() => {
    if (compact) {
      return data.filter((_, i) => i % 5 === 0 || i === data.length - 1);
    }
    return data;
  }, [data, compact]);

  const height = compact ? 120 : 180;

  // Check if there's any data
  const hasData = data.some(d => d.total > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-xs"
        style={{ height }}
      >
        No investment data for this area
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="year"
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            interval={compact ? 0 : 'preserveStartEnd'}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 9, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          {!compact && (
            <Legend
              wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
              formatter={(value) => DRIVER_NAMES[value] || value}
            />
          )}
          <Area
            type="monotone"
            dataKey="asset_replacement"
            stackId="1"
            stroke={DRIVER_COLORS.asset_replacement}
            fill={DRIVER_COLORS.asset_replacement}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="load_reinforcement"
            stackId="1"
            stroke={DRIVER_COLORS.load_reinforcement}
            fill={DRIVER_COLORS.load_reinforcement}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="proactive_investment"
            stackId="1"
            stroke={DRIVER_COLORS.proactive_investment}
            fill={DRIVER_COLORS.proactive_investment}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="fault_level"
            stackId="1"
            stroke={DRIVER_COLORS.fault_level}
            fill={DRIVER_COLORS.fault_level}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="reverse_power_flow"
            stackId="1"
            stroke={DRIVER_COLORS.reverse_power_flow}
            fill={DRIVER_COLORS.reverse_power_flow}
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="connections"
            stackId="1"
            stroke={DRIVER_COLORS.connections}
            fill={DRIVER_COLORS.connections}
            fillOpacity={0.8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BoundaryInvestmentChart;
