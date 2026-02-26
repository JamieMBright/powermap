'use client';

import { useState, useCallback } from 'react';
import { DRIVER_COLORS } from '@/lib/maplibre';
import type { DriverSelection } from '@/hooks/useBoundaryInvestments';

// Investment driver metadata
const DRIVER_METADATA: Record<string, { name: string; description: string }> = {
  asset_replacement: {
    name: 'Asset Replacement',
    description: 'Aging asset replacement',
  },
  load_reinforcement: {
    name: 'Load Reinforcement',
    description: 'Demand growth support',
  },
  proactive_investment: {
    name: 'Proactive Investment',
    description: 'Strategic future-proofing',
  },
  fault_level: {
    name: 'Fault Level',
    description: 'Fault current management',
  },
  reverse_power_flow: {
    name: 'Reverse Power Flow',
    description: 'Bi-directional flow support',
  },
  connections: {
    name: 'Connections',
    description: 'Customer/generation connections',
  },
};

interface InvestmentDriverSelectorProps {
  selectedDriver: DriverSelection;
  onDriverChange: (driver: DriverSelection) => void;
  className?: string;
}

export function InvestmentDriverSelector({
  selectedDriver,
  onDriverChange,
  className = '',
}: InvestmentDriverSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback(
    (driver: DriverSelection) => {
      onDriverChange(driver);
      setIsOpen(false);
    },
    [onDriverChange]
  );

  const selectedLabel =
    selectedDriver === 'all'
      ? 'All Drivers'
      : DRIVER_METADATA[selectedDriver]?.name || selectedDriver;

  const selectedColor =
    selectedDriver === 'all'
      ? '#f97316' // Orange for "all"
      : DRIVER_COLORS[selectedDriver as keyof typeof DRIVER_COLORS] || '#94a3b8';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
          bg-gray-900/90 border border-gray-700 hover:bg-gray-800
          transition-colors duration-150 text-sm
          ${isOpen ? 'ring-2 ring-orange-500' : ''}
        `}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="font-medium text-gray-200">{selectedLabel}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900/95 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
          {/* All Drivers option */}
          <button
            onClick={() => handleSelect('all')}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-left
              hover:bg-gray-700 transition-colors
              ${selectedDriver === 'all' ? 'bg-orange-900/30' : ''}
            `}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#f97316' }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-200">All Drivers</div>
              <div className="text-xs text-gray-400">Total investment</div>
            </div>
            {selectedDriver === 'all' && (
              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <div className="border-t border-gray-700" />

          {/* Individual driver options */}
          {Object.entries(DRIVER_METADATA).map(([key, meta]) => {
            const isActive = selectedDriver === key;
            const color = DRIVER_COLORS[key as keyof typeof DRIVER_COLORS] || '#94a3b8';

            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left
                  hover:bg-gray-700 transition-colors
                  ${isActive ? 'bg-orange-900/30' : ''}
                `}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{meta.name}</div>
                  <div className="text-xs text-gray-400">{meta.description}</div>
                </div>
                {isActive && (
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InvestmentDriverSelector;
