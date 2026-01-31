import type { StyleSpecification, LngLatBoundsLike } from 'maplibre-gl';

// Minimal grayscale basemap style - designed to let infrastructure stand out
// Uses OpenFreeMap vector tiles (OpenMapTiles schema)
const minimalStyle: StyleSpecification = {
  version: 8,
  name: 'PowerMap Minimal',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    'openmaptiles': {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    },
  },
  layers: [
    // Background - off-white
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#fafafa',
      },
    },
    // Land - subtle fill for landmass visibility at low zoom
    {
      id: 'land',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      paint: {
        'fill-color': '#f3f4f6',
      },
    },
    // Water - more visible blue for context at all zoom levels
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#c7d9e8',
      },
    },
    // Landcover - very subtle differentiation (optional, keeps it minimal)
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'grass'],
      paint: {
        'fill-color': '#e8f0e8',
        'fill-opacity': 0.6,
      },
    },
    // Landcover - woodland/forest
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      paint: {
        'fill-color': '#dce8dc',
        'fill-opacity': 0.5,
      },
    },
    // Buildings - very light gray, only at higher zoom
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-color': '#eeeeee',
        'fill-opacity': 0.6,
      },
    },
    // Minor roads - light gray
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: [
        'all',
        ['in', ['get', 'class'], ['literal', ['minor', 'service', 'path', 'track']]],
      ],
      minzoom: 10,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#e5e7eb',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          10, 0.5,
          14, 2,
          18, 4,
        ],
      },
    },
    // Secondary/tertiary roads - medium gray (visible from zoom 6)
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: [
        'all',
        ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]],
      ],
      minzoom: 6,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#c4c7cc',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          6, 0.3,
          8, 0.8,
          12, 2,
          16, 5,
        ],
      },
    },
    // Primary roads - darker gray (visible from zoom 4)
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'primary'],
      minzoom: 4,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#b8bcc2',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.3,
          6, 0.8,
          10, 2,
          14, 4,
          18, 8,
        ],
      },
    },
    // Motorways/trunk roads - darkest gray roads (visible from zoom 2)
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk']]],
      minzoom: 2,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#9ca3af',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          2, 0.3,
          4, 0.8,
          8, 2,
          12, 4,
          16, 8,
        ],
      },
    },
    // Railway lines - dashed gray
    {
      id: 'railway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'rail'],
      minzoom: 8,
      paint: {
        'line-color': '#c4c7cc',
        'line-width': 1,
        'line-dasharray': [3, 3],
      },
    },
    // Boundaries - country borders
    {
      id: 'boundary-country',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['==', ['get', 'admin_level'], 2],
      paint: {
        'line-color': '#6b7280',
        'line-width': 1.5,
        'line-dasharray': [4, 2],
      },
    },
    // Boundaries - region/county borders (visible from zoom 4)
    {
      id: 'boundary-region',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['in', ['get', 'admin_level'], ['literal', [4, 6]]],
      minzoom: 4,
      paint: {
        'line-color': '#9ca3af',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.5,
          8, 1,
        ],
        'line-dasharray': [2, 2],
        'line-opacity': 0.6,
      },
    },
    // Place labels - country names
    {
      id: 'place-country',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'country'],
      maxzoom: 6,
      layout: {
        'text-field': ['get', 'name:en'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 14,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
      },
      paint: {
        'text-color': '#6b7280',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    },
    // Place labels - cities (visible from zoom 3)
    {
      id: 'place-city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'city'],
      minzoom: 3,
      maxzoom: 14,
      layout: {
        'text-field': ['get', 'name:en'],
        'text-font': ['Noto Sans Medium'],
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          3, 9,
          5, 11,
          10, 14,
        ],
      },
      paint: {
        'text-color': '#374151',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    },
    // Place labels - towns (visible from zoom 6)
    {
      id: 'place-town',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'town'],
      minzoom: 6,
      maxzoom: 15,
      layout: {
        'text-field': ['get', 'name:en'],
        'text-font': ['Noto Sans Regular'],
        'text-size': [
          'interpolate', ['linear'], ['zoom'],
          6, 8,
          8, 10,
          12, 12,
        ],
      },
      paint: {
        'text-color': '#4b5563',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    },
    // Place labels - villages
    {
      id: 'place-village',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['==', ['get', 'class'], 'village'],
      minzoom: 10,
      layout: {
        'text-field': ['get', 'name:en'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
      },
      paint: {
        'text-color': '#9ca3af',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    },
    // Road labels - major roads
    {
      id: 'road-label-major',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
      minzoom: 10,
      layout: {
        'text-field': ['get', 'name:en'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-max-angle': 30,
      },
      paint: {
        'text-color': '#6b7280',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    },
  ],
};

// Legacy OSM raster style (backup)
const osmRasterStyle: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Map styles available for use
export const MAP_STYLES = {
  // Minimal grayscale style - infrastructure stands out
  minimal: minimalStyle,
  // Legacy OSM raster (colorful, backup option)
  osm: osmRasterStyle,
  // CARTO Positron (external style, may have CSP issues)
  carto: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// Map configuration - centered on UKPN coverage area
export const MAP_CONFIG = {
  style: MAP_STYLES.minimal, // Minimal grayscale style so infrastructure stands out
  // Center on Essex/East London area - heart of UKPN territory
  center: [0.3, 51.6] as [number, number],
  // Zoom level 8 shows county-level detail
  zoom: 8,
  minZoom: 5,
  maxZoom: 18,
  // UKPN coverage area bounds (East Anglia, London, South East)
  bounds: [
    [-2.0, 50.0],  // Southwest
    [2.0, 53.0]    // Northeast
  ] as LngLatBoundsLike,
};

// Investment driver colors
export const DRIVER_COLORS: Record<string, string> = {
  asset_replacement: '#3b82f6',     // Blue
  load_reinforcement: '#f59e0b',    // Amber
  proactive_investment: '#10b981',  // Emerald
  fault_level: '#ef4444',           // Red
  reverse_power_flow: '#8b5cf6',    // Violet
  connections: '#06b6d4',           // Cyan
};

// Asset type colors
export const ASSET_COLORS: Record<string, string> = {
  substation: '#dc2626',
  transformer: '#ea580c',
  cable: '#65a30d',
  overhead_line: '#0891b2',
  switchgear: '#7c3aed',
};

// Boundary layer styles
export const BOUNDARY_STYLES = {
  line: {
    color: '#f97316',  // orange-500
    width: 2,
    opacity: 0.8,
  },
  fill: {
    color: '#f97316',  // orange-500
    opacity: 0.1,
  },
  highlight: {
    fillOpacity: 0.3,
    lineWidth: 3,
  },
};

/**
 * Voltage color configuration for power infrastructure visualization.
 *
 * Voltage thresholds and their meanings in the UK power network:
 * - 275kV+ (Purple): National Grid transmission - highest voltage backbone network
 * - 132kV+ (Red): Sub-transmission - regional distribution from grid supply points
 * - 33kV+ (Amber): Primary distribution - feeds primary substations and large industrial loads
 * - 11kV+ (Green): Secondary distribution - most common distribution voltage, feeds local transformers
 * - default (Gray): Low voltage (<11kV) or unknown - typically 400V/230V consumer supply
 *
 * Colors chosen for visual distinction and accessibility on map backgrounds.
 */
export const VOLTAGE_COLORS = {
  '275kV+': '#7c3aed',  // Purple - transmission (violet-600)
  '132kV+': '#dc2626',  // Red - sub-transmission (red-600)
  '33kV+': '#f59e0b',   // Amber - primary distribution (amber-500)
  '11kV+': '#22c55e',   // Green - secondary distribution (green-500)
  'default': '#94a3b8', // Gray - unknown/low voltage (slate-400)
} as const;

/**
 * Voltage thresholds in volts for use in MapLibre expressions.
 * These correspond to the keys in VOLTAGE_COLORS.
 */
export const VOLTAGE_THRESHOLDS = {
  '275kV+': 275000,
  '132kV+': 132000,
  '33kV+': 33000,
  '11kV+': 11000,
} as const;

/**
 * Substation-specific default color (when voltage is unknown).
 * Substations use blue instead of gray for better visibility.
 */
export const SUBSTATION_DEFAULT_COLOR = '#3b82f6'; // Blue (blue-500)
