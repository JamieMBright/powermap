'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Map as MaplibreMap, MapMouseEvent } from 'maplibre-gl';
import type { BoundaryType } from '@/data/types';
import {
  BOUNDARY_CONFIGS,
  getBoundaryTypes,
  addBoundaryToMap,
  removeBoundaryFromMap,
  getBoundaryFeatureAtPoint,
  type BoundaryConfig,
} from '@/lib/boundaries';

interface BoundarySelectorProps {
  map: MaplibreMap | null;
  className?: string;
}

interface BoundaryInfoPopup {
  code: string;
  name: string;
  boundaryType: BoundaryType;
  position: { x: number; y: number };
}

export function BoundarySelector({ map, className = '' }: BoundarySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBoundary, setActiveBoundary] = useState<BoundaryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<BoundaryInfoPopup | null>(null);

  const boundaryTypes = getBoundaryTypes();

  // Handle boundary selection
  const handleBoundarySelect = useCallback(async (boundaryType: BoundaryType | null) => {
    if (!map) return;

    setError(null);
    setPopup(null);

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
  }, [map, activeBoundary]);

  // Handle click on boundary to show info popup
  useEffect(() => {
    if (!map || !activeBoundary) return;

    const handleClick = (e: MapMouseEvent) => {
      const feature = getBoundaryFeatureAtPoint(map, activeBoundary, e.point);
      if (feature) {
        setPopup({
          code: feature.properties.code,
          name: feature.properties.name,
          boundaryType: activeBoundary,
          position: { x: e.point.x, y: e.point.y },
        });
      } else {
        setPopup(null);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, activeBoundary]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.boundary-popup')) {
        setPopup(null);
      }
    };

    if (popup) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [popup]);

  const activeConfig = activeBoundary ? BOUNDARY_CONFIGS[activeBoundary] : null;

  return (
    <div className={`absolute top-20 left-4 z-20 ${className}`}>
      {/* Selector button/dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
            bg-white border border-gray-200 hover:bg-gray-50
            transition-colors duration-150
            ${isOpen ? 'ring-2 ring-indigo-500' : ''}
            ${isLoading ? 'opacity-75 cursor-wait' : ''}
          `}
        >
          {/* Color indicator */}
          <span
            className="w-3 h-3 rounded-full border border-gray-300"
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

        {/* Dropdown menu */}
        {isOpen && (
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
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Info popup */}
      {popup && (
        <BoundaryInfoPanel
          popup={popup}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

// Individual boundary option component
interface BoundaryOptionProps {
  config: BoundaryConfig;
  isActive: boolean;
  onClick: () => void;
}

function BoundaryOption({ config, isActive, onClick }: BoundaryOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-left
        hover:bg-gray-50 transition-colors
        ${isActive ? 'bg-indigo-50' : ''}
      `}
    >
      {/* Color indicator */}
      <span
        className={`w-3 h-3 rounded-full ${isActive ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
        style={{ backgroundColor: config.colors.fill }}
      />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{config.name}</div>
        <div className="text-xs text-gray-500 truncate">{config.description}</div>
      </div>

      {/* Checkmark for active */}
      {isActive && (
        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
}

function BoundaryInfoPanel({ popup, onClose }: BoundaryInfoPanelProps) {
  const config = BOUNDARY_CONFIGS[popup.boundaryType];

  return (
    <div
      className="boundary-popup mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
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

      {/* Placeholder for future aggregate data */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400 italic">
          Investment data will be displayed here
        </p>
      </div>
    </div>
  );
}

export { BoundarySelector as default };
