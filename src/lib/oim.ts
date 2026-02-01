import type { Map as MaplibreMap, SourceSpecification, LayerSpecification, ExpressionSpecification } from 'maplibre-gl';
import { VOLTAGE_COLORS, VOLTAGE_THRESHOLDS, SUBSTATION_DEFAULT_COLOR, UK_BOUNDS } from './maplibre';

// OIM status tracking
export type OIMStatus = 'loading' | 'loaded' | 'error' | 'unavailable';

export interface OIMLoadResult {
  status: OIMStatus;
  error?: string;
  layersAdded: string[];
}

// UK bounds filter expression for limiting infrastructure display
const UK_BOUNDS_FILTER: ExpressionSpecification = [
  'all',
  ['>=', ['get', '$x'], UK_BOUNDS.west],
  ['<=', ['get', '$x'], UK_BOUNDS.east],
  ['>=', ['get', '$y'], UK_BOUNDS.south],
  ['<=', ['get', '$y'], UK_BOUNDS.north],
];

// Open Infrastructure Map tile configuration
// Note: OIM tiles are global, we filter to UK in layer filters
export const OIM_SOURCE: SourceSpecification = {
  type: 'vector',
  tiles: ['https://openinframap.org/map/power/{z}/{x}/{y}.pbf'],
  minzoom: 2,
  maxzoom: 17,
  // Restrict tile requests to UK area for performance
  bounds: [UK_BOUNDS.west, UK_BOUNDS.south, UK_BOUNDS.east, UK_BOUNDS.north],
  attribution: '© <a href="https://openinframap.org">Open Infrastructure Map</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// Voltage color expression - uses green gradient
const voltageColorExpression: ExpressionSpecification = [
  'case',
  ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['275kV+']], VOLTAGE_COLORS['275kV+'],
  ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['132kV+']], VOLTAGE_COLORS['132kV+'],
  ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['33kV+']], VOLTAGE_COLORS['33kV+'],
  ['>=', ['to-number', ['get', 'voltage'], 0], VOLTAGE_THRESHOLDS['11kV+']], VOLTAGE_COLORS['11kV+'],
  VOLTAGE_COLORS['default']
];

// Power line layer - green gradient by voltage
export const POWER_LINE_LAYER: LayerSpecification = {
  id: 'oim-power-line',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 2,
  paint: {
    'line-color': voltageColorExpression,
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      2, 0.5,
      5, 1,
      10, 2,
      15, 4
    ],
    'line-opacity': [
      'interpolate', ['linear'], ['zoom'],
      2, 0.6,
      8, 0.9
    ],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

// Substation point layer - colored by voltage
export const SUBSTATION_LAYER: LayerSpecification = {
  id: 'oim-substation',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 5,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      5, 2,
      8, 4,
      12, 7,
      16, 12
    ],
    'circle-color': voltageColorExpression,
    'circle-stroke-width': [
      'interpolate', ['linear'], ['zoom'],
      5, 0.5,
      10, 1.5,
      15, 2
    ],
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

// Substation labels - show name and ref/ID
export const SUBSTATION_LABEL_LAYER: LayerSpecification = {
  id: 'oim-substation-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 10,
  layout: {
    'text-field': [
      'case',
      ['all', ['has', 'name'], ['has', 'ref']],
      ['concat', ['get', 'name'], '\n', ['get', 'ref']],
      ['has', 'name'],
      ['get', 'name'],
      ['has', 'ref'],
      ['get', 'ref'],
      ''
    ],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      10, 9,
      14, 12
    ],
    'text-anchor': 'top',
    'text-offset': [0, 0.8],
    'text-max-width': 8,
    'text-optional': true,
  },
  paint: {
    'text-color': '#1f2937',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5,
  },
};

// Power towers layer
export const POWER_TOWER_LAYER: LayerSpecification = {
  id: 'oim-power-tower',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_tower',
  filter: ['==', ['get', 'type'], 'tower'],
  minzoom: 12,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      12, 2,
      16, 5,
      20, 8
    ],
    'circle-color': '#374151',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.8,
  },
};

// Power poles layer
export const POWER_POLE_LAYER: LayerSpecification = {
  id: 'oim-power-pole',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_tower',
  filter: ['==', ['get', 'type'], 'pole'],
  minzoom: 14,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      14, 2,
      18, 4
    ],
    'circle-color': '#6b7280',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.7,
  },
};

// Transformer layer
export const TRANSFORMER_LAYER: LayerSpecification = {
  id: 'oim-transformer',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 12,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      12, 3,
      16, 6,
      20, 10
    ],
    'circle-color': '#f59e0b',  // Amber for transformers
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

// Transformer labels - show ref/ID
export const TRANSFORMER_LABEL_LAYER: LayerSpecification = {
  id: 'oim-transformer-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 14,
  layout: {
    'text-field': [
      'case',
      ['has', 'ref'],
      ['get', 'ref'],
      ['has', 'name'],
      ['get', 'name'],
      ''
    ],
    'text-size': 10,
    'text-anchor': 'top',
    'text-offset': [0, 0.6],
    'text-optional': true,
  },
  paint: {
    'text-color': '#b45309',  // Amber-700 for transformer labels
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5,
  },
};

// Wind turbine layer
export const WIND_TURBINE_LAYER: LayerSpecification = {
  id: 'oim-wind-turbine',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['==', ['get', 'source'], 'wind'],
  minzoom: 8,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      8, 2,
      11, 4,
      14, 8
    ],
    'circle-color': '#0ea5e9',  // Sky blue for wind
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

// Solar panel/generator layer
export const SOLAR_LAYER: LayerSpecification = {
  id: 'oim-solar',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['==', ['get', 'source'], 'solar'],
  minzoom: 10,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      10, 2,
      14, 5,
      18, 8
    ],
    'circle-color': '#eab308',  // Yellow for solar
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
  },
};

// Power plant layer
export const POWER_PLANT_LAYER: LayerSpecification = {
  id: 'oim-power-plant',
  type: 'fill',
  source: 'oim-power',
  'source-layer': 'power_plant',
  minzoom: 6,
  paint: {
    'fill-color': '#78716c',  // Stone color for power plants
    'fill-opacity': 0.3,
    'fill-outline-color': '#44403c',
  },
};

// Power plant labels
export const POWER_PLANT_LABEL_LAYER: LayerSpecification = {
  id: 'oim-power-plant-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_plant_point',
  minzoom: 8,
  layout: {
    'text-field': ['get', 'name'],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      8, 9,
      12, 12
    ],
    'text-anchor': 'center',
    'text-max-width': 10,
    'text-optional': true,
  },
  paint: {
    'text-color': '#44403c',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5,
  },
};

// All OIM layer IDs for reference
export const OIM_LAYER_IDS = [
  'oim-power-plant',
  'oim-power-line',
  'oim-substation',
  'oim-power-tower',
  'oim-power-pole',
  'oim-transformer',
  'oim-wind-turbine',
  'oim-solar',
  'oim-substation-label',
  'oim-power-plant-label',
  'oim-transformer-label',
] as const;

// All OIM layers with their specs
const ALL_OIM_LAYERS = [
  { spec: POWER_PLANT_LAYER, name: 'power plants' },
  { spec: POWER_LINE_LAYER, name: 'power lines' },
  { spec: SUBSTATION_LAYER, name: 'substations' },
  { spec: POWER_TOWER_LAYER, name: 'power towers' },
  { spec: POWER_POLE_LAYER, name: 'power poles' },
  { spec: TRANSFORMER_LAYER, name: 'transformers' },
  { spec: WIND_TURBINE_LAYER, name: 'wind turbines' },
  { spec: SOLAR_LAYER, name: 'solar generators' },
  { spec: SUBSTATION_LABEL_LAYER, name: 'substation labels' },
  { spec: POWER_PLANT_LABEL_LAYER, name: 'power plant labels' },
  { spec: TRANSFORMER_LABEL_LAYER, name: 'transformer labels' },
];

// Test if OIM tiles are accessible
async function testOIMAvailability(): Promise<boolean> {
  try {
    // Test with a single tile request (zoom 5, center of UK)
    const testUrl = 'https://openinframap.org/map/power/5/15/10.pbf';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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

  // Track if we've already called onStatusChange with a final status
  let hasReportedFinalStatus = false;
  const reportStatus = (status: OIMStatus, error?: string) => {
    if (hasReportedFinalStatus && (status === 'loaded' || status === 'error' || status === 'unavailable')) {
      return;
    }
    if (status !== 'loading') {
      hasReportedFinalStatus = true;
    }
    onStatusChange?.(status, error);
  };

  reportStatus('loading');

  try {
    // First test if OIM is accessible
    const isAvailable = await testOIMAvailability();

    if (!isAvailable) {
      console.warn('[OIM] Infrastructure map tiles are not available');
      result.status = 'unavailable';
      result.error = 'Infrastructure map service is currently unavailable';
      reportStatus('unavailable', result.error);
      return result;
    }

    // Add source if not already present
    if (!map.getSource('oim-power')) {
      map.addSource('oim-power', OIM_SOURCE);
      console.log('[OIM] Source added');
    }

    // Add all layers with error handling
    for (const { spec, name } of ALL_OIM_LAYERS) {
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
        reportStatus('error', result.error);
      }
    };

    map.on('error', sourceErrorHandler);

    // Listen for successful data load
    const sourceDataHandler = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (e.sourceId === 'oim-power' && e.isSourceLoaded) {
        console.log('[OIM] Source data loaded successfully');
        result.status = 'loaded';
        reportStatus('loaded');
        map.off('sourcedata', sourceDataHandler);
      }
    };

    map.on('sourcedata', sourceDataHandler);

    // Set initial status based on layers added
    if (result.layersAdded.length > 0) {
      result.status = 'loaded';
      reportStatus('loaded');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error loading infrastructure map';
    console.error('[OIM] Failed to add layers:', errorMessage);
    result.status = 'error';
    result.error = errorMessage;
    reportStatus('error', errorMessage);
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

    // Add all layers
    for (const { spec, name } of ALL_OIM_LAYERS) {
      try {
        if (!map.getLayer(spec.id)) {
          map.addLayer(spec);
          console.log(`[OIM] ${name} layer added`);
        }
      } catch (layerError) {
        console.error(`[OIM] Failed to add ${name} layer:`, layerError);
      }
    }

    // Set up error listener
    map.on('error', (e) => {
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
