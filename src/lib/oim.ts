import type { Map as MaplibreMap, SourceSpecification, LayerSpecification } from 'maplibre-gl';
import { VOLTAGE_COLORS, VOLTAGE_THRESHOLDS, SUBSTATION_DEFAULT_COLOR } from './maplibre';

// OIM status tracking
export type OIMStatus = 'loading' | 'loaded' | 'error' | 'unavailable';

export interface OIMLoadResult {
  status: OIMStatus;
  error?: string;
  layersAdded: string[];
}

// Open Infrastructure Map tile configuration
export const OIM_SOURCE: SourceSpecification = {
  type: 'vector',
  tiles: ['https://openinframap.org/tiles/power/{z}/{x}/{y}.pbf'],
  minzoom: 2,
  maxzoom: 17,
  attribution: '© <a href="https://openinframap.org">Open Infrastructure Map</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// Power line layer - colors configured in maplibre.ts VOLTAGE_COLORS
export const POWER_LINE_LAYER: LayerSpecification = {
  id: 'oim-power-line',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 3,
  paint: {
    'line-color': [
      'case',
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['275kV+']], VOLTAGE_COLORS['275kV+'],
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['132kV+']], VOLTAGE_COLORS['132kV+'],
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['33kV+']], VOLTAGE_COLORS['33kV+'],
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['11kV+']], VOLTAGE_COLORS['11kV+'],
      VOLTAGE_COLORS['default']
    ],
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      5, 1,
      10, 2,
      15, 3
    ],
    'line-opacity': 0.8,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

// Substation layer - colors configured in maplibre.ts VOLTAGE_COLORS
export const SUBSTATION_LAYER: LayerSpecification = {
  id: 'oim-substation',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_substation',
  minzoom: 8,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      8, 3,
      12, 6,
      16, 10
    ],
    'circle-color': [
      'case',
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['132kV+']], VOLTAGE_COLORS['132kV+'],
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['33kV+']], VOLTAGE_COLORS['33kV+'],
      ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['11kV+']], VOLTAGE_COLORS['11kV+'],
      SUBSTATION_DEFAULT_COLOR
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

// Substation labels
export const SUBSTATION_LABEL_LAYER: LayerSpecification = {
  id: 'oim-substation-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_substation',
  minzoom: 11,
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 11,
    'text-anchor': 'top',
    'text-offset': [0, 0.8],
    'text-max-width': 8,
  },
  paint: {
    'text-color': '#374151',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5,
  },
};

// OIM layer IDs for easy reference
export const OIM_LAYER_IDS = ['oim-power-line', 'oim-substation', 'oim-substation-label'] as const;

// Test if OIM tiles are accessible
async function testOIMAvailability(): Promise<boolean> {
  try {
    // Test with a single tile request (zoom 5, center of UK)
    const testUrl = 'https://openinframap.org/tiles/power/5/15/10.pbf';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('[OIM] Availability test failed:', error);
    return false;
  }
}

// Add OIM layers to map with error handling (async version with status callbacks)
export async function addOIMToMapAsync(
  map: MaplibreMap,
  onStatusChange?: (status: OIMStatus, error?: string) => void
): Promise<OIMLoadResult> {
  const result: OIMLoadResult = {
    status: 'loading',
    layersAdded: [],
  };

  onStatusChange?.('loading');

  try {
    // First test if OIM is accessible
    const isAvailable = await testOIMAvailability();

    if (!isAvailable) {
      console.warn('[OIM] Infrastructure map tiles are not available');
      result.status = 'unavailable';
      result.error = 'Infrastructure map service is currently unavailable';
      onStatusChange?.('unavailable', result.error);
      return result;
    }

    // Add source if not already present
    if (!map.getSource('oim-power')) {
      map.addSource('oim-power', OIM_SOURCE);
      console.log('[OIM] Source added');
    }

    // Add layers with error handling for each
    const layersToAdd = [
      { spec: POWER_LINE_LAYER, name: 'power lines' },
      { spec: SUBSTATION_LAYER, name: 'substations' },
      { spec: SUBSTATION_LABEL_LAYER, name: 'substation labels' },
    ];

    for (const { spec, name } of layersToAdd) {
      try {
        if (!map.getLayer(spec.id)) {
          map.addLayer(spec);
          result.layersAdded.push(spec.id);
          console.log(`[OIM] Layer added: ${name}`);
        }
      } catch (layerError) {
        console.error(`[OIM] Failed to add ${name} layer:`, layerError);
      }
    }

    // Set up error listener for source loading errors
    const sourceErrorHandler = (e: { error?: Error; sourceId?: string }) => {
      if (e.sourceId === 'oim-power' || (e.error?.message?.includes('oim') ?? false)) {
        console.error('[OIM] Source error:', e.error);
        result.status = 'error';
        result.error = 'Failed to load infrastructure map tiles';
        onStatusChange?.('error', result.error);
      }
    };

    map.on('error', sourceErrorHandler);

    // Listen for successful data load
    const sourceDataHandler = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (e.sourceId === 'oim-power' && e.isSourceLoaded) {
        console.log('[OIM] Source data loaded successfully');
        result.status = 'loaded';
        onStatusChange?.('loaded');
        // Remove the listener after successful load
        map.off('sourcedata', sourceDataHandler);
      }
    };

    map.on('sourcedata', sourceDataHandler);

    // Set initial status based on layers added
    if (result.layersAdded.length > 0) {
      result.status = 'loaded';
      onStatusChange?.('loaded');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error loading infrastructure map';
    console.error('[OIM] Failed to add layers:', errorMessage);
    result.status = 'error';
    result.error = errorMessage;
    onStatusChange?.('error', errorMessage);
    return result;
  }
}

// Synchronous version for backward compatibility (no availability check)
export function addOIMToMap(map: MaplibreMap): void {
  try {
    // Add source
    if (!map.getSource('oim-power')) {
      map.addSource('oim-power', OIM_SOURCE);
      console.log('[OIM] Source added');
    }

    // Add layers
    if (!map.getLayer('oim-power-line')) {
      map.addLayer(POWER_LINE_LAYER);
      console.log('[OIM] Power line layer added');
    }

    if (!map.getLayer('oim-substation')) {
      map.addLayer(SUBSTATION_LAYER);
      console.log('[OIM] Substation layer added');
    }

    if (!map.getLayer('oim-substation-label')) {
      map.addLayer(SUBSTATION_LABEL_LAYER);
      console.log('[OIM] Substation label layer added');
    }

    // Set up error listener for source loading errors
    map.on('error', (e) => {
      // Check if this is an OIM-related error
      const errorMsg = e.error?.message || '';
      if (errorMsg.includes('oim') || errorMsg.includes('openinframap')) {
        console.error('[OIM] Source loading error:', errorMsg);
      }
    });
  } catch (error) {
    console.error('[OIM] Failed to add layers:', error);
  }
}

// Toggle OIM visibility
export function setOIMVisibility(map: MaplibreMap, visible: boolean): void {
  const visibility = visible ? 'visible' : 'none';

  OIM_LAYER_IDS.forEach(layerId => {
    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    } catch (error) {
      console.warn(`[OIM] Failed to set visibility for ${layerId}:`, error);
    }
  });
}

// Check if OIM layers are currently visible
export function isOIMVisible(map: MaplibreMap): boolean {
  try {
    const layer = map.getLayer('oim-power-line');
    if (!layer) return false;
    const visibility = map.getLayoutProperty('oim-power-line', 'visibility');
    return visibility !== 'none';
  } catch {
    return false;
  }
}

// Remove OIM layers and source from map
export function removeOIMFromMap(map: MaplibreMap): void {
  // Remove layers first (must be done before removing source)
  OIM_LAYER_IDS.forEach(layerId => {
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    } catch (error) {
      console.warn(`[OIM] Failed to remove layer ${layerId}:`, error);
    }
  });

  // Remove source
  try {
    if (map.getSource('oim-power')) {
      map.removeSource('oim-power');
    }
  } catch (error) {
    console.warn('[OIM] Failed to remove source:', error);
  }
}

// Check if OIM source has loaded data successfully
export function checkOIMSourceLoaded(map: MaplibreMap): boolean {
  try {
    const source = map.getSource('oim-power');
    return source !== undefined;
  } catch {
    return false;
  }
}
