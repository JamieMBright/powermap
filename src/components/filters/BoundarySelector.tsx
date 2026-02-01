'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Map as MaplibreMap, MapMouseEvent } from 'maplibre-gl';
import type { BoundaryType } from '@/data/types';
import {
  BOUNDARY_CONFIGS,
  getBoundaryTypes,
  addBoundaryToMap,
  removeBoundaryFromMap,
  getBoundaryFeatureAtPoint,
  updateBoundaryChoropleth,
  resetBoundaryChoropleth,
  type BoundaryConfig,
} from '@/lib/boundaries';
import { useSelectedBoundary } from '@/contexts/BoundaryContext';
import { useYearFilter } from '@/hooks/useYearFilter';
import { useBoundaryInvestments, type DriverSelection } from '@/hooks/useBoundaryInvestments';
import { InvestmentDriverSelector } from './InvestmentDriverSelector';
import { InvestmentLegend } from '@/components/ui/InvestmentLegend';
import dynamic from 'next/dynamic';
import { useBoundaryTimeSeries } from '@/hooks/useBoundaryTimeSeries';

const BoundaryInvestmentChart = dynamic(
  () => import('@/components/ui/BoundaryInvestmentChart'),
  { ssr: false, loading: () => <div className="h-24 flex items-center justify-center text-xs text-gray-400">Loading chart...</div> }
);

interface BoundarySelectorProps {
  map: MaplibreMap | null;
  className?: string;
  /** Whether a tour is currently active (hides controls on mobile) */
  isTourActive?: boolean;
}

interface BoundaryInfoPopup {
  code: string;
  name: string;
  boundaryType: BoundaryType;
  position: { x: number; y: number };
}

// Custom hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Default boundary type to load on startup
const DEFAULT_BOUNDARY: BoundaryType = 'gsp';

export function BoundarySelector({ map, className = '', isTourActive = false }: BoundarySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBoundary, setActiveBoundary] = useState<BoundaryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<BoundaryInfoPopup | null>(null);
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverSelection>('all');
  const isMobile = useIsMobile();

  // Refs for stable event handler access to current values
  const mapRef = useRef(map);
  const activeBoundaryRef = useRef(activeBoundary);

  // Use boundary context for selected boundary state
  const { selectBoundary, clearBoundary } = useSelectedBoundary();

  // Get current year from URL state
  const { year } = useYearFilter();

  // Calculate investment stats per boundary
  const { stats: investmentStats } = useBoundaryInvestments(year, {
    boundaryType: activeBoundary,
    selectedDriver,
    enabled: !!activeBoundary && !!map,
  });

  // Ref for investment stats (used by stable event handler)
  const investmentStatsRef = useRef(investmentStats);

  // Keep refs updated with latest values
  useEffect(() => {
    mapRef.current = map;
    activeBoundaryRef.current = activeBoundary;
    investmentStatsRef.current = investmentStats;
  });

  const boundaryTypes = getBoundaryTypes();

  // Auto-load default boundary when map is ready
  useEffect(() => {
    if (!map || hasLoadedDefault) return;

    const loadDefaultBoundary = async () => {
      setIsLoading(true);
      try {
        await addBoundaryToMap(map, DEFAULT_BOUNDARY);
        setActiveBoundary(DEFAULT_BOUNDARY);
        setHasLoadedDefault(true);
      } catch (err) {
        console.error('[BoundarySelector] Failed to load default boundary:', err);
        setError(err instanceof Error ? err.message : 'Failed to load default boundary');
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultBoundary();
  }, [map, hasLoadedDefault]);

  // Handle boundary selection
  const handleBoundarySelect = useCallback(async (boundaryType: BoundaryType | null) => {
    if (!map) return;

    setError(null);
    setPopup(null);
    // Clear selected boundary in context when changing boundary type
    clearBoundary();

    // Remove current boundary if exists
    if (activeBoundary) {
      removeBoundaryFromMap(map, activeBoundary);
    }

    // If selecting the same boundary or null, just deselect
    if (boundaryType === null || boundaryType === activeBoundary) {
      setActiveBoundary(null);
      setIsOpen(false);
      return;
    }

    // Load and add new boundary
    setIsLoading(true);
    try {
      await addBoundaryToMap(map, boundaryType);
      setActiveBoundary(boundaryType);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boundary');
      setActiveBoundary(null);
    } finally {
      setIsLoading(false);
    }
  }, [map, activeBoundary, clearBoundary]);

  // Handle click on boundary to show info popup and update context
  useEffect(() => {
    if (!map || !activeBoundary) return;

    const handleClick = (e: MapMouseEvent) => {
      const feature = getBoundaryFeatureAtPoint(map, activeBoundary, e.point);
      if (feature) {
        const boundaryInfo = {
          code: feature.properties.code,
          name: feature.properties.name,
          boundaryType: activeBoundary,
          position: { x: e.point.x, y: e.point.y },
        };
        setPopup(boundaryInfo);
        // Update context with selected boundary
        selectBoundary({
          type: activeBoundary,
          code: feature.properties.code,
          name: feature.properties.name,
        });
      } else {
        setPopup(null);
        clearBoundary();
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, activeBoundary, selectBoundary, clearBoundary]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.boundary-popup') && !target.closest('.aggregation-panel')) {
        setPopup(null);
        // Note: We don't clear boundary context here to allow the AggregationPanel to remain open
      }
    };

    if (popup) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [popup]);

  // Update choropleth when investment stats change
  useEffect(() => {
    if (!map || !activeBoundary) return;

    if (investmentStats && investmentStats.byCode.size > 0) {
      updateBoundaryChoropleth(
        map,
        activeBoundary,
        investmentStats.byCode,
        investmentStats.min,
        investmentStats.max
      );
    } else {
      resetBoundaryChoropleth(map, activeBoundary);
    }
  }, [map, activeBoundary, investmentStats]);

  const activeConfig = activeBoundary ? BOUNDARY_CONFIGS[activeBoundary] : null;

  // Close bottom sheet when clicking backdrop
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Hide entirely on mobile during tours to reduce visual clutter
  // Note: Must be after all hooks to avoid violating Rules of Hooks
  if (isMobile && isTourActive) {
    return null;
  }

  return (
    <div data-testid="boundary-selector" className={`absolute top-14 left-2 z-20 sm:top-20 sm:left-4 ${className}`}>
      {/* Selector button - larger on mobile for 44px tap target */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          data-testid="boundary-selector-button"
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-lg shadow-lg
            bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100
            transition-colors duration-150 min-h-[44px]
            sm:py-2 sm:min-h-0
            ${isOpen ? 'ring-2 ring-orange-500' : ''}
            ${isLoading ? 'opacity-75 cursor-wait' : ''}
          `}
        >
          {/* Color indicator */}
          <span
            className="w-4 h-4 rounded-full border border-gray-300 sm:w-3 sm:h-3"
            style={{
              backgroundColor: activeConfig?.colors.fill ?? '#e5e7eb',
            }}
          />

          {/* Label */}
          <span className="text-sm font-medium text-gray-700">
            {isLoading ? 'Loading...' : activeConfig?.name ?? 'Boundaries'}
          </span>

          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Desktop dropdown menu */}
        {isOpen && !isMobile && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Clear option */}
            <button
              onClick={() => handleBoundarySelect(null)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left
                hover:bg-gray-50 transition-colors
                ${!activeBoundary ? 'bg-gray-50' : ''}
              `}
            >
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">None</div>
                <div className="text-xs text-gray-500">Hide all boundaries</div>
              </div>
            </button>

            {/* Separator */}
            <div className="border-t border-gray-100" />

            {/* Boundary options */}
            {boundaryTypes.map((type) => {
              const config = BOUNDARY_CONFIGS[type];
              const isActive = activeBoundary === type;

              return (
                <BoundaryOption
                  key={type}
                  config={config}
                  isActive={isActive}
                  onClick={() => handleBoundarySelect(type)}
                  testId={`boundary-option-${type}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isOpen && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Handle indicator */}
            <div className="sticky top-0 bg-white pt-3 pb-2 px-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Select Boundary</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Options list */}
            <div className="py-2">
              {/* Clear option */}
              <button
                onClick={() => handleBoundarySelect(null)}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 text-left
                  active:bg-gray-100 transition-colors
                  ${!activeBoundary ? 'bg-orange-50' : ''}
                `}
              >
                <span className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-gray-900">None</div>
                  <div className="text-sm text-gray-500">Hide all boundaries</div>
                </div>
                {!activeBoundary && (
                  <svg className="w-5 h-5 text-orange-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Separator */}
              <div className="border-t border-gray-100 my-1" />

              {/* Boundary options */}
              {boundaryTypes.map((type) => {
                const config = BOUNDARY_CONFIGS[type];
                const isActive = activeBoundary === type;

                return (
                  <BoundaryOptionMobile
                    key={type}
                    config={config}
                    isActive={isActive}
                    onClick={() => handleBoundarySelect(type)}
                    testId={`boundary-option-${type}`}
                  />
                );
              })}
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-safe-area-inset-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg max-w-[200px] sm:max-w-none">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Info popup */}
      {popup && (
        <BoundaryInfoPanel
          popup={popup}
          onClose={() => setPopup(null)}
          isMobile={isMobile}
        />
      )}

      {/* Investment driver selector - shown when boundary is active */}
      {activeBoundary && (
        <div className="mt-2">
          <InvestmentDriverSelector
            selectedDriver={selectedDriver}
            onDriverChange={setSelectedDriver}
          />
        </div>
      )}

      {/* Investment legend - shown when boundary is active and has data */}
      {activeBoundary && investmentStats && investmentStats.max > 0 && (
        <div className="mt-2">
          <InvestmentLegend
            minAmount={investmentStats.min}
            maxAmount={investmentStats.max}
          />
        </div>
      )}
    </div>
  );
}

// Individual boundary option component (desktop)
interface BoundaryOptionProps {
  config: BoundaryConfig;
  isActive: boolean;
  onClick: () => void;
  testId?: string;
}

function BoundaryOption({ config, isActive, onClick, testId }: BoundaryOptionProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-left
        hover:bg-gray-50 transition-colors
        ${isActive ? 'bg-orange-50' : ''}
      `}
    >
      {/* Color indicator */}
      <span
        className={`w-3 h-3 rounded-full ${isActive ? 'ring-2 ring-offset-1 ring-orange-500' : ''}`}
        style={{ backgroundColor: config.colors.fill }}
      />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{config.name}</div>
        <div className="text-xs text-gray-500 truncate">{config.description}</div>
      </div>

      {/* Checkmark for active */}
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
}

// Mobile-optimized boundary option with larger tap targets
function BoundaryOptionMobile({ config, isActive, onClick, testId }: BoundaryOptionProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`
        w-full flex items-center gap-4 px-4 py-4 text-left
        active:bg-gray-100 transition-colors min-h-[56px]
        ${isActive ? 'bg-orange-50' : ''}
      `}
    >
      {/* Color indicator - larger on mobile */}
      <span
        className={`w-5 h-5 rounded-full shrink-0 ${isActive ? 'ring-2 ring-offset-2 ring-orange-500' : ''}`}
        style={{ backgroundColor: config.colors.fill }}
      />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-gray-900">{config.name}</div>
        <div className="text-sm text-gray-500">{config.description}</div>
      </div>

      {/* Checkmark for active */}
      {isActive && (
        <svg className="w-5 h-5 text-orange-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

// Boundary info panel component
interface BoundaryInfoPanelProps {
  popup: BoundaryInfoPopup;
  onClose: () => void;
  isMobile?: boolean;
}

function BoundaryInfoPanel({ popup, onClose, isMobile = false }: BoundaryInfoPanelProps) {
  const config = BOUNDARY_CONFIGS[popup.boundaryType];
  const { data: timeSeriesData, isLoading: chartLoading } = useBoundaryTimeSeries({
    boundaryType: popup.boundaryType,
    boundaryCode: popup.code,
    enabled: true,
  });

  // On mobile, show as a toast/card at the bottom
  if (isMobile) {
    return (
      <div className="fixed bottom-20 left-2 right-2 z-30 boundary-popup">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: `${config.colors.fill}20` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.colors.fill }}
              />
              <span className="text-sm font-medium text-gray-600">{config.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 hover:bg-white/50 active:bg-white/70 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <h3 className="text-base font-semibold text-gray-900">{popup.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Code: {popup.code}</p>
          </div>

          {/* Investment Chart */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="text-xs font-medium text-gray-600 mb-2">Investment 2025-2050</div>
            {chartLoading ? (
              <div className="h-24 flex items-center justify-center text-xs text-gray-400">Loading...</div>
            ) : timeSeriesData ? (
              <BoundaryInvestmentChart data={timeSeriesData} compact />
            ) : (
              <div className="h-24 flex items-center justify-center text-xs text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div
      className="boundary-popup mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-72"
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: `${config.colors.fill}20` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.colors.fill }}
          />
          <span className="text-xs font-medium text-gray-600">{config.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/50 rounded transition-colors"
        >
          <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-900">{popup.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">Code: {popup.code}</p>
      </div>

      {/* Investment Chart */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="text-xs font-medium text-gray-600 mb-2">Investment 2025-2050</div>
        {chartLoading ? (
          <div className="h-32 flex items-center justify-center text-xs text-gray-400">Loading...</div>
        ) : timeSeriesData ? (
          <BoundaryInvestmentChart data={timeSeriesData} compact />
        ) : (
          <div className="h-32 flex items-center justify-center text-xs text-gray-400">No data available</div>
        )}
      </div>
    </div>
  );
}

export { BoundarySelector as default };
