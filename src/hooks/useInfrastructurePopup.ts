import { useEffect, useRef, useCallback } from 'react';
import type { Map as MaplibreMap, MapMouseEvent, Popup } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import { OIM_LAYER_IDS } from '@/lib/oim';

/**
 * Infrastructure feature properties from OIM tiles
 */
interface InfrastructureFeature {
  name?: string;
  voltage?: string | number;
  operator?: string;
  source?: string;
  type?: string;
  ref?: string;
  output?: string;
  frequency?: string;
  cables?: string;
  wires?: string;
}

/**
 * Format voltage for display
 */
function formatVoltage(voltage: string | number | undefined): string {
  if (!voltage) return 'Unknown';

  const v = typeof voltage === 'string' ? parseInt(voltage, 10) : voltage;
  if (isNaN(v)) return String(voltage);

  if (v >= 1000) {
    return `${(v / 1000).toFixed(0)}kV`;
  }
  return `${v}V`;
}

/**
 * Get infrastructure type label
 */
function getInfrastructureType(layerId: string, properties: InfrastructureFeature): string {
  if (layerId.includes('power-line')) return 'Power Line';
  if (layerId.includes('substation')) return 'Substation';
  if (layerId.includes('transformer')) return 'Transformer';
  if (layerId.includes('power-tower')) return 'Transmission Tower';
  if (layerId.includes('power-pole')) return 'Distribution Pole';
  if (layerId.includes('wind-turbine')) return 'Wind Turbine';
  if (layerId.includes('solar')) return 'Solar Generator';
  if (layerId.includes('power-plant')) return 'Power Station';

  return properties.type || 'Infrastructure';
}

/**
 * Get icon for infrastructure type
 */
function getInfrastructureIcon(layerId: string): string {
  if (layerId.includes('power-line')) return '⚡';
  if (layerId.includes('substation')) return '🔌';
  if (layerId.includes('transformer')) return '🔄';
  if (layerId.includes('power-tower')) return '🗼';
  if (layerId.includes('power-pole')) return '📍';
  if (layerId.includes('wind-turbine')) return '🌬️';
  if (layerId.includes('solar')) return '☀️';
  if (layerId.includes('power-plant')) return '🏭';
  return '⚡';
}

/**
 * Generate popup HTML content for infrastructure feature
 */
function generatePopupContent(layerId: string, properties: InfrastructureFeature): string {
  const type = getInfrastructureType(layerId, properties);
  const icon = getInfrastructureIcon(layerId);
  const name = properties.name || 'Unnamed';

  let details = '';

  // Voltage
  if (properties.voltage) {
    details += `<div class="flex justify-between"><span class="text-gray-500">Voltage:</span><span class="font-medium">${formatVoltage(properties.voltage)}</span></div>`;
  }

  // Operator
  if (properties.operator) {
    details += `<div class="flex justify-between"><span class="text-gray-500">Operator:</span><span class="font-medium">${properties.operator}</span></div>`;
  }

  // Source (for generators)
  if (properties.source && properties.source !== 'unknown') {
    const sourceLabel = properties.source.charAt(0).toUpperCase() + properties.source.slice(1);
    details += `<div class="flex justify-between"><span class="text-gray-500">Source:</span><span class="font-medium">${sourceLabel}</span></div>`;
  }

  // Output (for generators/plants)
  if (properties.output) {
    details += `<div class="flex justify-between"><span class="text-gray-500">Output:</span><span class="font-medium">${properties.output}</span></div>`;
  }

  // Reference number
  if (properties.ref) {
    details += `<div class="flex justify-between"><span class="text-gray-500">Reference:</span><span class="font-medium">${properties.ref}</span></div>`;
  }

  // Cables/wires (for lines)
  if (properties.cables) {
    details += `<div class="flex justify-between"><span class="text-gray-500">Cables:</span><span class="font-medium">${properties.cables}</span></div>`;
  }

  if (properties.wires) {
    details += `<div class="flex justify-between"><span class="text-gray-500">Wires:</span><span class="font-medium">${properties.wires}</span></div>`;
  }

  return `
    <div class="min-w-48 max-w-64">
      <div class="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
        <span class="text-lg">${icon}</span>
        <div>
          <div class="font-semibold text-gray-900 text-sm">${type}</div>
          <div class="text-xs text-gray-600">${name}</div>
        </div>
      </div>
      <div class="space-y-1 text-xs">
        ${details || '<span class="text-gray-400">No additional details available</span>'}
      </div>
    </div>
  `;
}

/**
 * Hook to add click interactivity to infrastructure layers
 */
export function useInfrastructurePopup(map: MaplibreMap | null): void {
  const popupRef = useRef<Popup | null>(null);

  const handleClick = useCallback((e: MapMouseEvent) => {
    if (!map) return;

    // Query features from all OIM layers at click point
    const clickableLayers = OIM_LAYER_IDS.filter(
      id => !id.includes('label') // Exclude label layers
    );

    const features = map.queryRenderedFeatures(e.point, {
      layers: clickableLayers as unknown as string[],
    });

    if (features.length === 0) {
      // Close popup if clicking empty area
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      return;
    }

    // Get the top feature
    const feature = features[0];
    const layerId = feature.layer.id;
    const properties = feature.properties as InfrastructureFeature;

    // Create popup content
    const content = generatePopupContent(layerId, properties);

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // Determine popup location
    // For lines, use click point; for points, use feature geometry
    let lngLat = e.lngLat;
    if (feature.geometry.type === 'Point') {
      const coords = feature.geometry.coordinates as [number, number];
      lngLat = new maplibregl.LngLat(coords[0], coords[1]);
    }

    // Create and add popup
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px',
      className: 'infrastructure-popup',
    })
      .setLngLat(lngLat)
      .setHTML(content)
      .addTo(map);
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // Wait for map to be fully loaded
    const setupClickHandlers = () => {
      // Change cursor on hover over clickable layers
      const clickableLayers = OIM_LAYER_IDS.filter(id => !id.includes('label'));

      clickableLayers.forEach(layerId => {
        if (!map.getLayer(layerId)) return;

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      // Add click handler
      map.on('click', handleClick);
    };

    // Setup handlers when style is loaded
    if (map.isStyleLoaded()) {
      // Small delay to ensure OIM layers are added
      setTimeout(setupClickHandlers, 500);
    } else {
      map.once('load', () => {
        setTimeout(setupClickHandlers, 500);
      });
    }

    return () => {
      // Cleanup
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      map.off('click', handleClick);
    };
  }, [map, handleClick]);
}
