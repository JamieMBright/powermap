import type { Map as MaplibreMap, SourceSpecification, LayerSpecification } from 'maplibre-gl';

// Open Infrastructure Map tile configuration
export const OIM_SOURCE: SourceSpecification = {
  type: 'vector',
  tiles: ['https://openinframap.org/tiles/power/{z}/{x}/{y}.pbf'],
  minzoom: 2,
  maxzoom: 17,
  attribution: '© <a href="https://openinframap.org">Open Infrastructure Map</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// Power line layer
export const POWER_LINE_LAYER: LayerSpecification = {
  id: 'oim-power-line',
  type: 'line',
  source: 'oim-power',
  'source-layer': 'power_line',
  minzoom: 3,
  paint: {
    'line-color': [
      'case',
      ['>=', ['to-number', ['get', 'voltage'], 0], 275000], '#7c3aed', // 275kV+ = Purple
      ['>=', ['to-number', ['get', 'voltage'], 0], 132000], '#dc2626', // 132kV+ = Red
      ['>=', ['to-number', ['get', 'voltage'], 0], 33000], '#f59e0b',  // 33kV+ = Amber
      ['>=', ['to-number', ['get', 'voltage'], 0], 11000], '#22c55e',  // 11kV+ = Green
      '#94a3b8' // Default = Gray
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

// Substation layer
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
      ['>=', ['to-number', ['get', 'voltage'], 0], 132000], '#dc2626', // 132kV+ = Red
      ['>=', ['to-number', ['get', 'voltage'], 0], 33000], '#f59e0b',  // 33kV+ = Amber
      ['>=', ['to-number', ['get', 'voltage'], 0], 11000], '#22c55e',  // 11kV+ = Green
      '#3b82f6' // Default = Blue
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

// Add OIM layers to map
export function addOIMToMap(map: MaplibreMap): void {
  // Add source
  if (!map.getSource('oim-power')) {
    map.addSource('oim-power', OIM_SOURCE);
  }

  // Add layers
  if (!map.getLayer('oim-power-line')) {
    map.addLayer(POWER_LINE_LAYER);
  }

  if (!map.getLayer('oim-substation')) {
    map.addLayer(SUBSTATION_LAYER);
  }

  if (!map.getLayer('oim-substation-label')) {
    map.addLayer(SUBSTATION_LABEL_LAYER);
  }
}

// Toggle OIM visibility
export function setOIMVisibility(map: MaplibreMap, visible: boolean): void {
  const visibility = visible ? 'visible' : 'none';
  const layers = ['oim-power-line', 'oim-substation', 'oim-substation-label'];

  layers.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
}
