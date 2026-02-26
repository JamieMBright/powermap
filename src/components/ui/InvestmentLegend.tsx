'use client';

import { CHOROPLETH_COLORS, getChoroplethBreakpoints } from '@/lib/boundaries';

interface InvestmentLegendProps {
  minAmount: number;
  maxAmount: number;
  className?: string;
}

/**
 * Format currency for legend display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `£${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `£${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `£${(amount / 1_000).toFixed(0)}K`;
  }
  return `£${amount.toFixed(0)}`;
}

export function InvestmentLegend({ minAmount, maxAmount, className = '' }: InvestmentLegendProps) {
  const breakpoints = getChoroplethBreakpoints(minAmount, maxAmount);

  return (
    <div className={`bg-gray-900/90 rounded-lg shadow-lg border border-gray-700 p-3 ${className}`}>
      <div className="text-xs font-medium text-gray-300 mb-2">Investment</div>

      {/* Gradient bar */}
      <div
        className="h-3 rounded"
        style={{
          background: `linear-gradient(to right, ${CHOROPLETH_COLORS.join(', ')})`,
        }}
      />

      {/* Min/Max labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{formatCurrency(minAmount)}</span>
        <span>{formatCurrency(maxAmount)}</span>
      </div>
    </div>
  );
}

export default InvestmentLegend;
