import type { StyleSpecification, LngLatBoundsLike } from 'maplibre-gl';

// Map style options - fallbacks if CARTO is unavailable
export const MAP_STYLES = {
  carto: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  osm: 'https://tiles.openfreemap.org/styles/liberty', // Fallback
};

// Map configuration
export const MAP_CONFIG = {
  style: MAP_STYLES.carto,
  center: [-0.1, 51.5] as [number, number], // London
  zoom: 7,
  minZoom: 5,
  maxZoom: 18,
  // Coverage area bounds (approximate)
  bounds: [
    [-2.5, 50.5],  // Southwest
    [2.0, 52.5]    // Northeast
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
