import type { StyleSpecification, LngLatBoundsLike } from 'maplibre-gl';

// Available map styles - external tile providers
export const MAP_STYLES: Record<string, string | StyleSpecification> = {
  // OpenStreetMap standard raster tiles
  osm: {
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
  },
  // CARTO Positron (light)
  'carto-light': {
    version: 8,
    sources: {
      'carto-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'carto-tiles-layer',
        type: 'raster',
        source: 'carto-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  // CARTO Dark Matter
  'carto-dark': {
    version: 8,
    sources: {
      'carto-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'carto-tiles-layer',
        type: 'raster',
        source: 'carto-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  // CARTO Voyager (colorful)
  'carto-voyager': {
    version: 8,
    sources: {
      'carto-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'carto-tiles-layer',
        type: 'raster',
        source: 'carto-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
};

// Style display names for UI
export const MAP_STYLE_NAMES: Record<string, string> = {
  'osm': 'OpenStreetMap',
  'carto-light': 'Light',
  'carto-dark': 'Dark',
  'carto-voyager': 'Voyager',
};

// Map configuration - centered on UKPN coverage area
export const MAP_CONFIG = {
  style: MAP_STYLES['carto-light'], // Default to light style
  center: [0.3, 51.6] as [number, number],
  zoom: 8,
  minZoom: 0,
  maxZoom: 18,
  bounds: [
    [-2.0, 50.0],
    [2.0, 53.0]
  ] as LngLatBoundsLike,
};

// UK bounding box for filtering infrastructure
export const UK_BOUNDS = {
  west: -8.0,
  south: 49.5,
  east: 2.5,
  north: 61.0,
} as const;

// Boundary layer styles (kept simple)
export const BOUNDARY_STYLES = {
  line: {
    color: '#f97316',
    width: 2,
    opacity: 0.4,
  },
  fill: {
    color: '#f97316',
    opacity: 0.05,
  },
  highlight: {
    fillOpacity: 0.15,
    lineWidth: 3,
  },
};

// Investment driver colors (for data visualization)
export const DRIVER_COLORS: Record<string, string> = {
  asset_replacement: '#3b82f6',     // Blue
  load_reinforcement: '#f59e0b',    // Amber
  proactive_investment: '#10b981',  // Emerald
  fault_level: '#ef4444',           // Red
  reverse_power_flow: '#8b5cf6',    // Violet
  connections: '#06b6d4',           // Cyan
};

// Asset type colors (for data visualization)
export const ASSET_COLORS: Record<string, string> = {
  substation: '#dc2626',
  transformer: '#ea580c',
  cable: '#65a30d',
  overhead_line: '#0891b2',
  switchgear: '#7c3aed',
};
