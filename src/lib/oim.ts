import type { Map as MaplibreMap, SourceSpecification, LayerSpecification, ExpressionSpecification } from 'maplibre-gl';
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

// OpenInfraMap voltage color scale (exact colors from OIM)
const VOLTAGE_SCALE: [number, string][] = [
  [0, '#7A7A85'],      // Unknown/null - gray
  [10000, '#6E97B8'],  // 10kV - blue
  [25000, '#55B555'],  // 25kV - green
  [52000, '#B59F10'],  // 52kV - gold
  [132000, '#B55D00'], // 132kV - orange
  [220000, '#C73030'], // 220kV - red
  [310000, '#B54EB2'], // 310kV - purple
  [550000, '#00C1CF'], // 550kV - cyan
];

// Voltage color expression matching OIM exactly
const voltageColorExpression: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
  ...VOLTAGE_SCALE.flat()
];

// Voltage-based line width (thicker for higher voltages)
const voltageLineWidth: ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'],
  0, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
    0, 0.5,
    132000, 1,
    400000, 1.5
  ],
  10, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
    0, 1,
    132000, 2,
    400000, 4
  ],
  20, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
    0, 2,
    132000, 4,
    400000, 7
  ]
];

// Power line layer - voltage colored like OIM
export const POWER_LINE_LAYER: LayerSpecification = {
  id: 'oim-power-line',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 0,
  filter: ['all',
    ['!=', ['get', 'location'], 'underground'],
    ['!=', ['get', 'line'], 'busbar']
  ],
  paint: {
    'line-color': voltageColorExpression,
    'line-width': voltageLineWidth,
    'line-opacity': 0.9,
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

// Underground power lines - dashed
export const POWER_LINE_UNDERGROUND_LAYER: LayerSpecification = {
  id: 'oim-power-line-underground',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 0,
  filter: ['==', ['get', 'location'], 'underground'],
  paint: {
    'line-color': voltageColorExpression,
    'line-width': voltageLineWidth,
    'line-opacity': 0.7,
    'line-dasharray': [3, 2],
  },
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
};

// Substation fill layer
export const SUBSTATION_FILL_LAYER: LayerSpecification = {
  id: 'oim-substation-fill',
  type: 'fill',
  source: 'oim-power',
  'source-layer': 'power_substation',
  minzoom: 13,
  paint: {
    'fill-color': voltageColorExpression,
    'fill-opacity': 0.3,
  },
};

// Substation outline layer
export const SUBSTATION_OUTLINE_LAYER: LayerSpecification = {
  id: 'oim-substation-outline',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_substation',
  minzoom: 13,
  paint: {
    'line-color': '#333',
    'line-width': 1,
    'line-opacity': 0.8,
  },
};

// Substation point layer (for low zoom)
export const SUBSTATION_POINT_LAYER: LayerSpecification = {
  id: 'oim-substation',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 5,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      5, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
        0, 1,
        132000, 3,
        400000, 5
      ],
      12, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
        0, 3,
        132000, 6,
        400000, 10
      ],
      20, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage'], 0], 0],
        0, 6,
        132000, 12,
        400000, 20
      ]
    ],
    'circle-color': voltageColorExpression,
    'circle-stroke-width': [
      'interpolate', ['linear'], ['zoom'],
      5, 0,
      10, 1,
      20, 2
    ],
    'circle-stroke-color': '#fff',
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
    'text-color': '#333',
    'text-halo-color': '#fff',
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
  minzoom: 13,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      13, 1.5,
      18, 4,
      21, 6
    ],
    'circle-color': '#444',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
    'circle-opacity': [
      'interpolate', ['linear'], ['zoom'],
      13, 0.5,
      14, 1
    ],
  },
};

// Power poles layer
export const POWER_POLE_LAYER: LayerSpecification = {
  id: 'oim-power-pole',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_tower',
  filter: ['==', ['get', 'type'], 'pole'],
  minzoom: 13,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      13, 1,
      18, 3,
      20, 4
    ],
    'circle-color': '#666',
    'circle-stroke-width': 0.5,
    'circle-stroke-color': '#fff',
    'circle-opacity': [
      'interpolate', ['linear'], ['zoom'],
      13, 0,
      13.5, 1
    ],
  },
};

// Transformer layer
export const TRANSFORMER_LAYER: LayerSpecification = {
  id: 'oim-transformer',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 14,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      14, 2,
      18, 5,
      20, 8
    ],
    'circle-color': voltageColorExpression,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
};

// Transformer labels
export const TRANSFORMER_LABEL_LAYER: LayerSpecification = {
  id: 'oim-transformer-label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 17,
  layout: {
    'text-field': ['coalesce', ['get', 'ref'], ['get', 'name'], ''],
    'text-size': 10,
    'text-anchor': 'top',
    'text-offset': [0, 0.6],
    'text-optional': true,
  },
  paint: {
    'text-color': '#333',
    'text-halo-color': '#fff',
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
  minzoom: 9,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      9, 0.5,
      11, 1.5,
      14, 4
    ],
    'circle-color': '#3b82f6',  // Blue
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
};

// Solar layer
export const SOLAR_LAYER: LayerSpecification = {
  id: 'oim-solar',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['==', ['get', 'source'], 'solar'],
  minzoom: 13,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      13, 1,
      16, 3,
      18, 5
    ],
    'circle-color': '#726BA9',  // OIM solar purple
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
};

// Power plant fill layer
export const POWER_PLANT_LAYER: LayerSpecification = {
  id: 'oim-power-plant',
  type: 'fill',
  source: 'oim-power',
  'source-layer': 'power_plant',
  minzoom: 6,
  paint: {
    'fill-color': 'hsl(30, 20%, 35%)',
    'fill-opacity': 0.5,
  },
};

// Power plant outline
export const POWER_PLANT_OUTLINE_LAYER: LayerSpecification = {
  id: 'oim-power-plant-outline',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_plant',
  minzoom: 6,
  paint: {
    'line-color': 'rgb(30, 30, 30)',
    'line-width': 1,
    'line-opacity': 0.8,
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
    'text-color': '#333',
    'text-halo-color': '#fff',
    'text-halo-width': 1.5,
  },
};

// All OIM layer IDs (in order from bottom to top)
export const OIM_LAYER_IDS = [
  'oim-power-plant',
  'oim-power-plant-outline',
  'oim-power-line-underground',
  'oim-power-line',
  'oim-substation-fill',
  'oim-substation-outline',
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

// First OIM layer (for inserting other layers before OIM)
export const FIRST_OIM_LAYER_ID = 'oim-power-plant';

// All OIM layers with their specs
const ALL_OIM_LAYERS = [
  { spec: POWER_PLANT_LAYER, name: 'power plants' },
  { spec: POWER_PLANT_OUTLINE_LAYER, name: 'power plant outlines' },
  { spec: POWER_LINE_UNDERGROUND_LAYER, name: 'underground power lines' },
  { spec: POWER_LINE_LAYER, name: 'power lines' },
  { spec: SUBSTATION_FILL_LAYER, name: 'substation fills' },
  { spec: SUBSTATION_OUTLINE_LAYER, name: 'substation outlines' },
  { spec: SUBSTATION_POINT_LAYER, name: 'substations' },
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
