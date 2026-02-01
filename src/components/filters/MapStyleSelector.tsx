'use client';

import { useState, useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { MAP_STYLES, MAP_STYLE_NAMES } from '@/lib/maplibre';
import { addOIMToMap, OIM_LAYER_IDS } from '@/lib/oim';

// Custom event for style change - allows other components to re-add their layers
export const MAP_STYLE_CHANGE_EVENT = 'powermap:stylechange';

interface MapStyleSelectorProps {
  map: MaplibreMap | null;
}

export function MapStyleSelector({ map }: MapStyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<string>('carto-light');

  const handleStyleChange = useCallback((styleKey: string) => {
    if (!map) return;

    const style = MAP_STYLES[styleKey];
    if (!style) return;

    // Store current OIM layer visibility states
    const layerVisibility: Record<string, string> = {};
    OIM_LAYER_IDS.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          const visibility = map.getLayoutProperty(layerId, 'visibility');
          layerVisibility[layerId] = visibility || 'visible';
        }
      } catch {
        // Ignore
      }
    });

    // Set the new style
    map.setStyle(style);

    // Re-add all layers after style loads
    map.once('style.load', () => {
      // Re-add OIM layers first
      addOIMToMap(map);

      // Restore OIM visibility states
      setTimeout(() => {
        OIM_LAYER_IDS.forEach(layerId => {
          try {
            if (map.getLayer(layerId) && layerVisibility[layerId]) {
              map.setLayoutProperty(layerId, 'visibility', layerVisibility[layerId]);
            }
          } catch {
            // Ignore
          }
        });

        // Dispatch custom event so other components can re-add their layers
        window.dispatchEvent(new CustomEvent(MAP_STYLE_CHANGE_EVENT, { detail: { map } }));
      }, 100);
    });

    setCurrentStyle(styleKey);
    setIsOpen(false);
  }, [map]);

  return (
    <div className="absolute top-24 right-2.5 z-10">
      {/* Style selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-white rounded shadow px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
        title="Change map style"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M8.157 2.176a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.25v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.452 4.26 1.762a1.5 1.5 0 0 0 1.146 0l4.084-1.69A1.5 1.5 0 0 0 18 14.75V3.873a1.5 1.5 0 0 0-2.074-1.386l-3.51 1.452-4.26-1.763ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="hidden sm:inline">{MAP_STYLE_NAMES[currentStyle] || 'Style'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded shadow-lg border border-gray-200 py-1">
          {Object.entries(MAP_STYLE_NAMES).map(([key, name]) => (
            <button
              key={key}
              onClick={() => handleStyleChange(key)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                currentStyle === key ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
              }`}
            >
              {currentStyle === key && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-orange-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {currentStyle !== key && <span className="w-4" />}
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
