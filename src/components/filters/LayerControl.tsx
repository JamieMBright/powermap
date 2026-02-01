'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { setOIMVisibility, OIM_LAYER_IDS } from '@/lib/oim';

interface LayerControlProps {
  map: MaplibreMap | null;
  className?: string;
}

// Layer group definitions
interface LayerGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  layers: string[];
  defaultVisible: boolean;
}

const LAYER_GROUPS: LayerGroup[] = [
  {
    id: 'power-lines',
    name: 'Power Lines',
    description: 'Transmission & distribution lines',
    color: '#22c55e',
    layers: ['oim-power-line'],
    defaultVisible: true,
  },
  {
    id: 'substations',
    name: 'Substations',
    description: 'Primary & secondary substations',
    color: '#15803d',
    layers: ['oim-substation', 'oim-substation-label'],
    defaultVisible: true,
  },
  {
    id: 'transformers',
    name: 'Transformers',
    description: 'Distribution transformers',
    color: '#f59e0b',
    layers: ['oim-transformer', 'oim-transformer-label'],
    defaultVisible: true,
  },
  {
    id: 'towers-poles',
    name: 'Towers & Poles',
    description: 'Pylons and distribution poles',
    color: '#374151',
    layers: ['oim-power-tower', 'oim-power-pole'],
    defaultVisible: true,
  },
  {
    id: 'generation',
    name: 'Generation',
    description: 'Power plants, wind & solar',
    color: '#0ea5e9',
    layers: ['oim-power-plant', 'oim-power-plant-label', 'oim-wind-turbine', 'oim-solar'],
    defaultVisible: true,
  },
  {
    id: 'roads',
    name: 'Roads',
    description: 'Road network',
    color: '#94a3b8',
    layers: ['road-motorway', 'road-primary', 'road-secondary', 'road-minor', 'road-label-major'],
    defaultVisible: true,
  },
  {
    id: 'railways',
    name: 'Railways',
    description: 'Rail lines',
    color: '#c4c7cc',
    layers: ['railway'],
    defaultVisible: true,
  },
  {
    id: 'buildings',
    name: 'Buildings',
    description: 'Building footprints',
    color: '#fef9e7',
    layers: ['building'],
    defaultVisible: true,
  },
  {
    id: 'labels',
    name: 'Place Labels',
    description: 'City, town, village names',
    color: '#475569',
    layers: ['place-country', 'place-city', 'place-town', 'place-village'],
    defaultVisible: true,
  },
];

export function LayerControl({ map, className = '' }: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    new Set(LAYER_GROUPS.filter(g => g.defaultVisible).map(g => g.id))
  );

  // Toggle layer group visibility
  const toggleGroup = useCallback((groupId: string) => {
    if (!map) return;

    const group = LAYER_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const isCurrentlyVisible = visibleGroups.has(groupId);
    const newVisibility = !isCurrentlyVisible;

    // Update state
    setVisibleGroups(prev => {
      const next = new Set(prev);
      if (newVisibility) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });

    // Update map layers
    group.layers.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', newVisibility ? 'visible' : 'none');
        }
      } catch (e) {
        // Layer might not exist yet
      }
    });
  }, [map, visibleGroups]);

  // Show all layers
  const showAll = useCallback(() => {
    if (!map) return;

    const allGroupIds = new Set(LAYER_GROUPS.map(g => g.id));
    setVisibleGroups(allGroupIds);

    LAYER_GROUPS.forEach(group => {
      group.layers.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
          }
        } catch (e) {
          // Layer might not exist
        }
      });
    });
  }, [map]);

  // Hide all layers
  const hideAll = useCallback(() => {
    if (!map) return;

    setVisibleGroups(new Set());

    LAYER_GROUPS.forEach(group => {
      group.layers.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        } catch (e) {
          // Layer might not exist
        }
      });
    });
  }, [map]);

  // Count visible groups
  const visibleCount = visibleGroups.size;
  const totalCount = LAYER_GROUPS.length;

  return (
    <div className={`absolute top-14 right-2 z-20 sm:top-20 sm:right-4 ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2.5 rounded-lg shadow-lg
          bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100
          transition-colors duration-150 min-h-[44px]
          sm:py-2 sm:min-h-0
          ${isOpen ? 'ring-2 ring-orange-500' : ''}
        `}
      >
        {/* Layers icon */}
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>

        <span className="text-sm font-medium text-gray-700">
          Layers
        </span>

        {/* Count badge */}
        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
          {visibleCount}/{totalCount}
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

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with quick actions */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Map Layers</span>
            <div className="flex gap-1">
              <button
                onClick={showAll}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded"
              >
                Show All
              </button>
              <button
                onClick={hideAll}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 hover:bg-gray-100 rounded"
              >
                Hide All
              </button>
            </div>
          </div>

          {/* Layer groups */}
          <div className="max-h-80 overflow-y-auto">
            {LAYER_GROUPS.map((group) => {
              const isVisible = visibleGroups.has(group.id);

              return (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left
                    hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0
                    ${isVisible ? '' : 'opacity-60'}
                  `}
                >
                  {/* Toggle checkbox */}
                  <div
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                      transition-colors
                      ${isVisible
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white border-gray-300'
                      }
                    `}
                  >
                    {isVisible && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Color indicator */}
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-gray-200"
                    style={{ backgroundColor: group.color }}
                  />

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700">{group.name}</div>
                    <div className="text-xs text-gray-500 truncate">{group.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Toggle layers to customize map display
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerControl;
