import type { Map as MaplibreMap, SourceSpecification, LayerSpecification } from 'maplibre-gl';
import { UK_BOUNDS } from './maplibre';

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
  tiles: ['https://openinframap.org/map/power/{z}/{x}/{y}.pbf'],
  minzoom: 2,
  maxzoom: 17,
  bounds: [UK_BOUNDS.west, UK_BOUNDS.south, UK_BOUNDS.east, UK_BOUNDS.north],
  attribution: '© <a href="https://openinframap.org">Open Infrastructure Map</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// Power line layer - basic styling
export const POWER_LINE_LAYER: LayerSpecification = {
  id: 'oim-power-line',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 2,
  paint: {
    'line-color': '#ff6600',
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      2, 0.5,
      8, 1.5,
      14, 3
    ],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

// Substation point layer
export const SUBSTATION_LAYER: LayerSpecification = {
  id: 'oim-substation',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 5,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      5, 3,
      10, 6,
      15, 10
    ],
    'circle-color': '#c026d3',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
};

// Substation labels
export const SUBSTATION_LABEL_LAYER: LayerSpecification = {
  id: 'oim-substation-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 10,
  layout: {
    'text-field': ['coalesce', ['get', 'name'], ['get', 'ref'], ''],
    'text-size': 11,
    'text-anchor': 'top',
    'text-offset': [0, 0.8],
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
      16, 5
    ],
    'circle-color': '#374151',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
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
      16, 6
    ],
    'circle-color': '#f59e0b',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
};

// Transformer labels
export const TRANSFORMER_LABEL_LAYER: LayerSpecification = {
  id: 'oim-transformer-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 14,
  layout: {
    'text-field': ['coalesce', ['get', 'ref'], ['get', 'name'], ''],
    'text-size': 10,
    'text-anchor': 'top',
    'text-offset': [0, 0.6],
    'text-optional': true,
  },
  paint: {
    'text-color': '#92400e',
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
      14, 6
    ],
    'circle-color': '#0ea5e9',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
};

// Solar layer
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
      14, 5
    ],
    'circle-color': '#eab308',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
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
    'fill-color': '#78716c',
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
    'text-size': 11,
    'text-anchor': 'center',
    'text-optional': true,
  },
  paint: {
    'text-color': '#44403c',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5,
  },
};

// All OIM layer IDs
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

// Test OIM availability
async function testOIMAvailability(): Promise<boolean> {
  try {
    const testUrl = 'https://openinframap.org/map/power/5/15/10.pbf';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Add OIM layers to map (async version)
export async function addOIMToMapAsync(
  map: MaplibreMap,
  onStatusChange?: (status: OIMStatus, error?: string) => void
): Promise<OIMLoadResult> {
  const result: OIMLoadResult = {
    status: 'loading',
    layersAdded: [],
  };

  let hasReportedFinalStatus = false;
  const reportStatus = (status: OIMStatus, error?: string) => {
    if (hasReportedFinalStatus && status !== 'loading') return;
    if (status !== 'loading') hasReportedFinalStatus = true;
    onStatusChange?.(status, error);
  };

  reportStatus('loading');

  try {
    const isAvailable = await testOIMAvailability();

    if (!isAvailable) {
      result.status = 'unavailable';
      result.error = 'Infrastructure map service is currently unavailable';
      reportStatus('unavailable', result.error);
      return result;
    }

    if (!map.getSource('oim-power')) {
      map.addSource('oim-power', OIM_SOURCE);
    }

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

    map.on('error', (e: { error?: Error; sourceId?: string }) => {
      if (e.sourceId === 'oim-power') {
        result.status = 'error';
        result.error = 'Failed to load infrastructure map tiles';
        reportStatus('error', result.error);
      }
    });

    if (result.layersAdded.length > 0) {
      result.status = 'loaded';
      reportStatus('loaded');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'error';
    result.error = errorMessage;
    reportStatus('error', errorMessage);
    return result;
  }
}

// Sync version for backward compatibility
export function addOIMToMap(map: MaplibreMap): void {
  try {
    if (!map.getSource('oim-power')) {
      map.addSource('oim-power', OIM_SOURCE);
    }

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
    } catch {
      // Ignore
    }
  });
}

// Check if OIM is visible
export function isOIMVisible(map: MaplibreMap): boolean {
  try {
    const layer = map.getLayer('oim-power-line');
    if (!layer) return false;
    return map.getLayoutProperty('oim-power-line', 'visibility') !== 'none';
  } catch {
    return false;
  }
}

// Remove OIM from map
export function removeOIMFromMap(map: MaplibreMap): void {
  OIM_LAYER_IDS.forEach(layerId => {
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    } catch {
      // Ignore
    }
  });

  try {
    if (map.getSource('oim-power')) {
      map.removeSource('oim-power');
    }
  } catch {
    // Ignore
  }
}

// Check if OIM source is loaded
export function checkOIMSourceLoaded(map: MaplibreMap): boolean {
  try {
    return map.getSource('oim-power') !== undefined;
  } catch {
    return false;
  }
}
