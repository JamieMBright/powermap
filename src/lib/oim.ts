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

// OpenInfraMap voltage color scale (values in kV)
// Stepwise function matching OIM exactly
const voltage_color = (field: string): ExpressionSpecification => {
  return [
    'step',
    ['to-number', ['coalesce', ['get', field], 0]],
    '#7A7A85',  // Default (null/unknown) - gray
    10, '#6E97B8',   // 10kV - blue
    25, '#55B555',   // 25kV - green
    52, '#B59F10',   // 52kV - gold
    132, '#B55D00',  // 132kV - orange
    220, '#C73030',  // 220kV - red
    310, '#B54EB2',  // 310kV - purple
    550, '#00C1CF',  // 550kV - cyan
  ] as ExpressionSpecification;
};

// Voltage-based line thickness (matching OIM)
const voltage_line_thickness: ExpressionSpecification = [
  'interpolate', ['exponential', 1.1], ['zoom'],
  1, 0.5,
  20, [
    'interpolate', ['linear'],
    ['coalesce', ['get', 'voltage'], 0],
    0, 1.5,
    20, 2,
    30, 4,
    100, 5,
    500, 7
  ]
];

// Power opacity (matching OIM)
const power_opacity: ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'],
  4, 0.6,
  8, 1
];

// Substation radius based on voltage
const substation_radius: ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'],
  5.5, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage']], 0],
    0, 0,
    200, 1,
    750, 3
  ],
  13, ['interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'voltage']], 0],
    10, 1,
    30, 3,
    100, 4,
    500, 8
  ],
  20, 8
];

// === LAYERS ===

// Underground power lines
const power_line_underground: LayerSpecification = {
  id: 'power_line_underground',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  filter: ['==', ['get', 'location'], 'underground'],
  minzoom: 0,
  paint: {
    'line-color': voltage_color('voltage'),
    'line-width': voltage_line_thickness,
    'line-dasharray': [3, 2],
    'line-opacity': power_opacity,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
};

// Overhead power lines
const power_line: LayerSpecification = {
  id: 'power_line',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  filter: ['all',
    ['!=', ['get', 'location'], 'underground'],
    ['!=', ['get', 'line'], 'busbar'],
    ['!=', ['get', 'line'], 'bay']
  ],
  minzoom: 0,
  paint: {
    'line-color': voltage_color('voltage'),
    'line-width': voltage_line_thickness,
    'line-opacity': power_opacity,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
};

// Power plant fill
const power_plant: LayerSpecification = {
  id: 'power_plant',
  type: 'fill',
  source: 'oim-power',
  'source-layer': 'power_plant',
  minzoom: 5,
  paint: {
    'fill-color': 'hsl(30, 20%, 35%)',
    'fill-opacity': 0.2,
  },
};

// Power plant outline
const power_plant_outline: LayerSpecification = {
  id: 'power_plant_outline',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_plant',
  minzoom: 8,
  paint: {
    'line-color': 'rgb(30, 30, 30)',
    'line-opacity': 0.8,
    'line-width': [
      'interpolate', ['exponential', 1.2], ['zoom'],
      8, 0,
      20, 4
    ],
  },
  layout: {
    'line-join': 'round',
  },
};

// Substation fill
const power_substation: LayerSpecification = {
  id: 'power_substation',
  type: 'fill',
  source: 'oim-power',
  'source-layer': 'power_substation',
  minzoom: 13,
  paint: {
    'fill-opacity': 0.3,
    'fill-color': voltage_color('voltage'),
  },
};

// Substation outline
const power_substation_outline: LayerSpecification = {
  id: 'power_substation_outline',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_substation',
  minzoom: 13,
  paint: {
    'line-color': 'rgb(30, 30, 30)',
    'line-opacity': 0.8,
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      13, 0.5,
      20, 4
    ],
  },
};

// Solar panel areas
const power_solar_panel: LayerSpecification = {
  id: 'power_solar_panel',
  type: 'fill',
  source: 'oim-power',
  'source-layer': 'power_generator_area',
  filter: ['==', ['get', 'source'], 'solar'],
  minzoom: 13,
  paint: {
    'fill-color': '#726BA9',
    'fill-outline-color': 'rgb(50, 50, 50)',
  },
};

// Power towers
const power_tower: LayerSpecification = {
  id: 'power_tower',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_tower',
  filter: ['==', ['get', 'type'], 'tower'],
  minzoom: 13,
  paint: {
    'circle-color': '#444',
    'circle-radius': [
      'interpolate', ['exponential', 1.2], ['zoom'],
      13, 1.5,
      21, 6
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1,
  },
};

// Power poles
const power_pole: LayerSpecification = {
  id: 'power_pole',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_tower',
  filter: ['==', ['get', 'type'], 'pole'],
  minzoom: 13,
  paint: {
    'circle-color': '#666',
    'circle-radius': [
      'interpolate', ['exponential', 1.3], ['zoom'],
      13, 1,
      20, 4
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 0.5,
    'circle-opacity': [
      'interpolate', ['linear'], ['zoom'],
      13, 0,
      13.5, 1
    ],
  },
};

// Transformers
const power_transformer: LayerSpecification = {
  id: 'power_transformer',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 14,
  paint: {
    'circle-color': voltage_color('voltage_primary'),
    'circle-radius': [
      'interpolate', ['exponential', 1.2], ['zoom'],
      14, 3,
      20, 8
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1.5,
  },
};

// Transformer labels
const power_transformer_label: LayerSpecification = {
  id: 'power_transformer_label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_transformer',
  minzoom: 17,
  layout: {
    'text-field': ['concat',
      ['case',
        ['has', 'voltage_primary'],
        ['concat', ['to-string', ['round', ['to-number', ['get', 'voltage_primary']]]], 'kV'],
        ''
      ],
      ['case',
        ['has', 'voltage_secondary'],
        ['concat', '/', ['to-string', ['round', ['to-number', ['get', 'voltage_secondary']]]], 'kV'],
        ''
      ]
    ],
    'text-size': 10,
    'text-anchor': 'top',
    'text-offset': [0, 1],
    'text-optional': true,
  },
  paint: {
    'text-color': 'hsl(0, 0%, 10%)',
    'text-halo-color': '#fff',
    'text-halo-width': 1.5,
    'text-halo-blur': 1,
  },
};

// Wind turbine points (low zoom)
const power_wind_turbine_point: LayerSpecification = {
  id: 'power_wind_turbine_point',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['==', ['get', 'source'], 'wind'],
  minzoom: 9,
  maxzoom: 11,
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      9, 0.5,
      11, 0.9
    ],
    'circle-color': '#fff',
    'circle-stroke-color': '#000',
    'circle-stroke-width': [
      'interpolate', ['linear'], ['zoom'],
      9, 0.3,
      11, 0.6
    ],
  },
};

// Wind turbines (high zoom)
const power_wind_turbine: LayerSpecification = {
  id: 'power_wind_turbine',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['==', ['get', 'source'], 'wind'],
  minzoom: 11,
  paint: {
    'circle-color': '#3b82f6',
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      11, 2,
      16, 6
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1,
  },
};

// Solar generators (points)
const power_generator_solar: LayerSpecification = {
  id: 'power_generator_solar',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['all',
    ['==', ['get', 'source'], 'solar'],
    ['==', ['get', 'is_node'], true]
  ],
  minzoom: 15,
  paint: {
    'circle-color': '#726BA9',
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      15, 2,
      20, 6
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1,
  },
};

// Other generators
const power_generator: LayerSpecification = {
  id: 'power_generator',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_generator',
  filter: ['all',
    ['!=', ['get', 'source'], 'wind'],
    ['!=', ['get', 'source'], 'solar'],
    ['has', 'output']
  ],
  minzoom: 11,
  paint: {
    'circle-color': '#059669',
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      11, 2,
      16, 6
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1,
  },
};

// Substation points
const power_substation_point: LayerSpecification = {
  id: 'power_substation_point',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 5,
  paint: {
    'circle-radius': substation_radius,
    'circle-color': voltage_color('voltage'),
    'circle-stroke-color': [
      'interpolate-hcl', ['linear'], ['zoom'],
      8, '#eee',
      12, '#333'
    ],
    'circle-stroke-width': [
      'interpolate', ['linear'], ['zoom'],
      5, 0,
      8, 0.5,
      20, 2
    ],
    'circle-opacity': power_opacity,
    'circle-stroke-opacity': power_opacity,
  },
};

// Substation labels
const power_substation_label: LayerSpecification = {
  id: 'power_substation_label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_substation_point',
  minzoom: 9,
  layout: {
    'text-field': ['coalesce', ['get', 'name'], ['get', 'ref'], ''],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      8, 10,
      18, 14
    ],
    'text-anchor': 'top',
    'text-offset': [0, 0.8],
    'text-optional': true,
    'text-max-width': 8,
  },
  paint: {
    'text-color': 'hsl(0, 0%, 10%)',
    'text-halo-color': '#fff',
    'text-halo-width': 1.5,
    'text-halo-blur': 1,
  },
};

// Power line labels
const power_line_label: LayerSpecification = {
  id: 'power_line_label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 10,
  layout: {
    'text-field': ['concat',
      ['coalesce', ['get', 'name'], ''],
      ['case',
        ['has', 'voltage'],
        ['concat', ' ', ['to-string', ['round', ['get', 'voltage']]], 'kV'],
        ''
      ]
    ],
    'symbol-placement': 'line',
    'symbol-spacing': 400,
    'text-size': [
      'interpolate', ['exponential', 1.4], ['zoom'],
      10, 10,
      20, 21
    ],
    'text-offset': [0, 1],
    'text-max-angle': 20,
  },
  paint: {
    'text-color': 'hsl(0, 0%, 10%)',
    'text-halo-color': '#fff',
    'text-halo-width': 1.5,
    'text-halo-blur': 1,
  },
};

// Power plant labels
const power_plant_label: LayerSpecification = {
  id: 'power_plant_label',
  type: 'symbol',
  source: 'oim-power',
  'source-layer': 'power_plant_point',
  minzoom: 5.5,
  layout: {
    'text-field': ['coalesce', ['get', 'name'], ''],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      7, 10,
      18, 14
    ],
    'text-anchor': 'top',
    'text-offset': [0, 1],
    'text-optional': true,
    'text-max-width': 10,
  },
  paint: {
    'text-color': 'hsl(0, 0%, 10%)',
    'text-halo-color': '#fff',
    'text-halo-width': 1.5,
    'text-halo-blur': 1,
  },
};

// Compensators (reactors, capacitors)
const power_compensator: LayerSpecification = {
  id: 'power_compensator',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_compensator',
  minzoom: 14,
  paint: {
    'circle-color': '#8b5cf6',
    'circle-radius': [
      'interpolate', ['exponential', 1.2], ['zoom'],
      14, 3,
      20, 8
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1,
  },
};

// Switches
const power_switch: LayerSpecification = {
  id: 'power_switch',
  type: 'circle',
  source: 'oim-power',
  'source-layer': 'power_switch',
  minzoom: 15,
  paint: {
    'circle-color': '#ef4444',
    'circle-radius': [
      'interpolate', ['exponential', 1.2], ['zoom'],
      15, 2,
      20, 6
    ],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': 1,
  },
};

// All OIM layer IDs (in order from bottom to top)
export const OIM_LAYER_IDS = [
  'power_plant',
  'power_plant_outline',
  'power_substation',
  'power_substation_outline',
  'power_solar_panel',
  'power_line_underground',
  'power_line',
  'power_tower',
  'power_pole',
  'power_transformer',
  'power_compensator',
  'power_switch',
  'power_wind_turbine_point',
  'power_wind_turbine',
  'power_generator_solar',
  'power_generator',
  'power_substation_point',
  'power_line_label',
  'power_substation_label',
  'power_plant_label',
  'power_transformer_label',
] as const;

// First OIM layer (for inserting other layers before OIM)
export const FIRST_OIM_LAYER_ID = 'power_plant';

// All OIM layers with their specs
const ALL_OIM_LAYERS = [
  { spec: power_plant, name: 'power plants' },
  { spec: power_plant_outline, name: 'power plant outlines' },
  { spec: power_substation, name: 'substation areas' },
  { spec: power_substation_outline, name: 'substation outlines' },
  { spec: power_solar_panel, name: 'solar panels' },
  { spec: power_line_underground, name: 'underground lines' },
  { spec: power_line, name: 'power lines' },
  { spec: power_tower, name: 'towers' },
  { spec: power_pole, name: 'poles' },
  { spec: power_transformer, name: 'transformers' },
  { spec: power_compensator, name: 'compensators' },
  { spec: power_switch, name: 'switches' },
  { spec: power_wind_turbine_point, name: 'wind turbine points' },
  { spec: power_wind_turbine, name: 'wind turbines' },
  { spec: power_generator_solar, name: 'solar generators' },
  { spec: power_generator, name: 'other generators' },
  { spec: power_substation_point, name: 'substation points' },
  { spec: power_line_label, name: 'line labels' },
  { spec: power_substation_label, name: 'substation labels' },
  { spec: power_plant_label, name: 'plant labels' },
  { spec: power_transformer_label, name: 'transformer labels' },
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
    const layer = map.getLayer('power_line');
    if (!layer) return false;
    return map.getLayoutProperty('power_line', 'visibility') !== 'none';
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
