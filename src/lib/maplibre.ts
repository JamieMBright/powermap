import type { StyleSpecification, LngLatBoundsLike } from 'maplibre-gl';

// Map style - using inline style definition for reliability
// This avoids CSP issues with external style.json files
export const MAP_STYLES = {
  // Inline style using OSM raster tiles (most reliable)
  osm: {
    version: 8 as const,
    sources: {
      'osm-tiles': {
        type: 'raster' as const,
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
        type: 'raster' as const,
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  // CARTO Positron (cleaner look, but may have CSP issues)
  carto: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// Map configuration - centered on UKPN coverage area
export const MAP_CONFIG = {
  style: MAP_STYLES.osm, // Use inline OSM style for reliability
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
