import type { Map as MaplibreMap, LayerSpecification, GeoJSONSourceSpecification } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { BoundaryType, BoundaryFeature } from '@/data/types';
import { FIRST_OIM_LAYER_ID } from './oim';

// Boundary configuration for each type
export interface BoundaryConfig {
  id: BoundaryType;
  name: string;
  description: string;
  dataPath: string;
  minZoom: number;
  labelMinZoom: number;
  colors: {
    fill: string;
    line: string;
    highlight: string;
  };
}

// Boundary type configurations
// minZoom set low (2) to allow boundaries visible even when zoomed out
export const BOUNDARY_CONFIGS: Record<BoundaryType, BoundaryConfig> = {
  resp: {
    id: 'resp',
    name: 'RESP',
    description: 'Regional Energy Strategic Planner boundaries',
    dataPath: '/data/boundaries/resp.geojson',
    minZoom: 2,
    labelMinZoom: 5,
    colors: {
      fill: '#8b5cf6',    // Violet
      line: '#7c3aed',
      highlight: '#a78bfa',
    },
  },
  gsp: {
    id: 'gsp',
    name: 'GSP',
    description: 'Grid Supply Point boundaries',
    dataPath: '/data/boundaries/gsp.geojson',
    minZoom: 2,
    labelMinZoom: 7,
    colors: {
      fill: '#1e3a5a',    // Deep navy
      line: '#1e3a5a',
      highlight: '#2d4a6a',
    },
  },
  la: {
    id: 'la',
    name: 'Local Authority',
    description: 'Local Authority boundaries',
    dataPath: '/data/boundaries/la.geojson',
    minZoom: 2,
    labelMinZoom: 9,
    colors: {
      fill: '#10b981',    // Emerald
      line: '#059669',
      highlight: '#34d399',
    },
  },
  lsoa: {
    id: 'lsoa',
    name: 'LSOA',
    description: 'Lower Layer Super Output Area boundaries',
    dataPath: '/data/boundaries/lsoa.geojson',
    minZoom: 8,
    labelMinZoom: 11,
    colors: {
      fill: '#f59e0b',    // Amber
      line: '#d97706',
      highlight: '#fbbf24',
    },
  },
};

// Get source ID for a boundary type
export function getBoundarySourceId(boundaryType: BoundaryType): string {
  return `boundary-${boundaryType}`;
}

// Get layer IDs for a boundary type
export function getBoundaryLayerIds(boundaryType: BoundaryType): {
  fill: string;
  line: string;
  highlight: string;
  label: string;
} {
  return {
    fill: `boundary-${boundaryType}-fill`,
    line: `boundary-${boundaryType}-line`,
    highlight: `boundary-${boundaryType}-highlight`,
    label: `boundary-${boundaryType}-label`,
  };
}

// Create fill layer specification
function createFillLayer(config: BoundaryConfig): LayerSpecification {
  const layerIds = getBoundaryLayerIds(config.id);
  return {
    id: layerIds.fill,
    type: 'fill',
    source: getBoundarySourceId(config.id),
    minzoom: config.minZoom,
    paint: {
      'fill-color': config.colors.fill,
      'fill-opacity': 0.05,  // Very transparent
    },
  };
}

// Create line layer specification
function createLineLayer(config: BoundaryConfig): LayerSpecification {
  const layerIds = getBoundaryLayerIds(config.id);
  return {
    id: layerIds.line,
    type: 'line',
    source: getBoundarySourceId(config.id),
    minzoom: config.minZoom,
    paint: {
      'line-color': config.colors.line,
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        config.minZoom, 0.5,
        config.minZoom + 4, 1,
        config.minZoom + 8, 1.5,
      ],
      'line-opacity': 0.4,  // More transparent
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
  };
}

// Create highlight layer specification (for hover/click states)
function createHighlightLayer(config: BoundaryConfig): LayerSpecification {
  const layerIds = getBoundaryLayerIds(config.id);
  return {
    id: layerIds.highlight,
    type: 'fill',
    source: getBoundarySourceId(config.id),
    minzoom: config.minZoom,
    paint: {
      'fill-color': config.colors.highlight,
      'fill-opacity': 0,
    },
    filter: ['==', ['get', 'code'], ''],
  };
}

// Create label layer specification
function createLabelLayer(config: BoundaryConfig): LayerSpecification {
  const layerIds = getBoundaryLayerIds(config.id);
  return {
    id: layerIds.label,
    type: 'symbol',
    source: getBoundarySourceId(config.id),
    minzoom: config.labelMinZoom,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        config.labelMinZoom, 10,
        config.labelMinZoom + 4, 14,
      ],
      'text-anchor': 'center',
      'text-max-width': 10,
      'text-allow-overlap': false,
      'symbol-placement': 'point',
    },
    paint: {
      'text-color': config.colors.line,
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
    },
  };
}

// Load GeoJSON data for a boundary type
export async function loadBoundaryData(boundaryType: BoundaryType): Promise<FeatureCollection> {
  const config = BOUNDARY_CONFIGS[boundaryType];
  const response = await fetch(config.dataPath);
  if (!response.ok) {
    throw new Error(`Failed to load boundary data for ${boundaryType}: ${response.statusText}`);
  }
  return response.json();
}

// Add boundary source and layers to map
export async function addBoundaryToMap(
  map: MaplibreMap,
  boundaryType: BoundaryType
): Promise<void> {
  const config = BOUNDARY_CONFIGS[boundaryType];
  const sourceId = getBoundarySourceId(boundaryType);
  const layerIds = getBoundaryLayerIds(boundaryType);

  // Check if source already exists (handles race conditions)
  if (map.getSource(sourceId)) {
    return;
  }

  // Load GeoJSON data
  const data = await loadBoundaryData(boundaryType);

  // Double-check after async operation (race condition protection)
  if (map.getSource(sourceId)) {
    return;
  }

  try {
    // Add source
    const sourceSpec: GeoJSONSourceSpecification = {
      type: 'geojson',
      data,
    };
    map.addSource(sourceId, sourceSpec);

    // Determine beforeId - add boundaries BEFORE OIM layers so infrastructure is on top
    const beforeId = map.getLayer(FIRST_OIM_LAYER_ID) ? FIRST_OIM_LAYER_ID : undefined;

    // Add layers in order (fill, highlight, line, label) - all before OIM layers
    map.addLayer(createFillLayer(config), beforeId);
    map.addLayer(createHighlightLayer(config), beforeId);
    map.addLayer(createLineLayer(config), beforeId);
    map.addLayer(createLabelLayer(config), beforeId);

    // Set up hover effect
    setupBoundaryHover(map, boundaryType);
  } catch (error) {
    // Ignore "already exists" errors from race conditions
    if (error instanceof Error && !error.message.includes('already exists')) {
      throw error;
    }
  }
}

// Remove boundary source and layers from map
export function removeBoundaryFromMap(map: MaplibreMap, boundaryType: BoundaryType): void {
  const sourceId = getBoundarySourceId(boundaryType);
  const layerIds = getBoundaryLayerIds(boundaryType);

  // Remove layers first
  const layerIdList = [layerIds.label, layerIds.line, layerIds.highlight, layerIds.fill];
  layerIdList.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  // Remove source
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

// Set boundary visibility
export function setBoundaryVisibility(
  map: MaplibreMap,
  boundaryType: BoundaryType,
  visible: boolean
): void {
  const layerIds = getBoundaryLayerIds(boundaryType);
  const visibility = visible ? 'visible' : 'none';

  Object.values(layerIds).forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
}

// Set up hover effect for boundary
function setupBoundaryHover(map: MaplibreMap, boundaryType: BoundaryType): void {
  const layerIds = getBoundaryLayerIds(boundaryType);
  let hoveredCode: string | null = null;

  map.on('mousemove', layerIds.fill, (e) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const code = (feature.properties?.code as string | undefined) ?? null;

      if (code && code !== hoveredCode) {
        // Reset previous hover
        if (hoveredCode) {
          map.setFilter(layerIds.highlight, ['==', ['get', 'code'], '']);
          map.setPaintProperty(layerIds.highlight, 'fill-opacity', 0);
        }

        // Set new hover
        hoveredCode = code;
        map.setFilter(layerIds.highlight, ['==', ['get', 'code'], code]);
        map.setPaintProperty(layerIds.highlight, 'fill-opacity', 0.3);
        map.getCanvas().style.cursor = 'pointer';
      }
    }
  });

  map.on('mouseleave', layerIds.fill, () => {
    if (hoveredCode) {
      map.setFilter(layerIds.highlight, ['==', ['get', 'code'], '']);
      map.setPaintProperty(layerIds.highlight, 'fill-opacity', 0);
      hoveredCode = null;
    }
    map.getCanvas().style.cursor = '';
  });
}

// Get boundary feature at click location
export function getBoundaryFeatureAtPoint(
  map: MaplibreMap,
  boundaryType: BoundaryType,
  point: { x: number; y: number }
): BoundaryFeature | null {
  const layerIds = getBoundaryLayerIds(boundaryType);
  const features = map.queryRenderedFeatures(
    [point.x, point.y],
    { layers: [layerIds.fill] }
  );

  if (features.length > 0) {
    return features[0] as unknown as BoundaryFeature;
  }
  return null;
}

// Highlight a specific boundary by code
export function highlightBoundary(
  map: MaplibreMap,
  boundaryType: BoundaryType,
  code: string | null
): void {
  const layerIds = getBoundaryLayerIds(boundaryType);

  if (code) {
    map.setFilter(layerIds.highlight, ['==', ['get', 'code'], code]);
    map.setPaintProperty(layerIds.highlight, 'fill-opacity', 0.3);
  } else {
    map.setFilter(layerIds.highlight, ['==', ['get', 'code'], '']);
    map.setPaintProperty(layerIds.highlight, 'fill-opacity', 0);
  }
}

// Get all boundary types as an ordered array
export function getBoundaryTypes(): BoundaryType[] {
  return ['resp', 'gsp', 'la', 'lsoa'];
}

// Get boundary config by type
export function getBoundaryConfig(boundaryType: BoundaryType): BoundaryConfig {
  return BOUNDARY_CONFIGS[boundaryType];
}

// Choropleth color scale (light blue to dark navy gradient)
export const CHOROPLETH_COLORS = [
  '#a8c8e8', // Light blue (lowest - visible even with no data)
  '#7fb0db', // Light-medium blue
  '#5898ce', // Medium blue
  '#3580ba', // Medium-dark blue
  '#1d5f94', // Dark blue
  '#10426d', // Very dark navy
  '#082845', // Darkest navy (highest)
] as const;

/**
 * Get choropleth color for a given investment amount
 */
export function getChoroplethColor(amount: number, minAmount: number, maxAmount: number): string {
  if (amount <= 0 || maxAmount <= minAmount) {
    return CHOROPLETH_COLORS[0];
  }

  const normalized = (amount - minAmount) / (maxAmount - minAmount);
  const index = Math.min(
    Math.floor(normalized * CHOROPLETH_COLORS.length),
    CHOROPLETH_COLORS.length - 1
  );
  return CHOROPLETH_COLORS[index];
}

/**
 * Get breakpoints for choropleth legend
 */
export function getChoroplethBreakpoints(minAmount: number, maxAmount: number): number[] {
  const range = maxAmount - minAmount;
  if (range <= 0) return [0];

  const numSteps = CHOROPLETH_COLORS.length;
  return Array.from({ length: numSteps }, (_, i) =>
    minAmount + (range * i) / (numSteps - 1)
  );
}

/**
 * Update boundary fill colors based on investment amounts (choropleth)
 */
export function updateBoundaryChoropleth(
  map: MaplibreMap,
  boundaryType: BoundaryType,
  investmentsByCode: Map<string, number>,
  minAmount: number,
  maxAmount: number
): void {
  const layerIds = getBoundaryLayerIds(boundaryType);

  if (!map.getLayer(layerIds.fill)) {
    return;
  }

  // Build match expression for data-driven fill color
  const matchExpression: (string | number | string[])[] = ['match', ['get', 'code']];

  investmentsByCode.forEach((amount, code) => {
    const color = getChoroplethColor(amount, minAmount, maxAmount);
    matchExpression.push(code, color);
  });

  // Default color for boundaries with no investment data
  matchExpression.push(CHOROPLETH_COLORS[0]);

  // Update the fill color with the match expression
  map.setPaintProperty(layerIds.fill, 'fill-color', matchExpression);
  // Set opacity - transparent enough to see infrastructure beneath
  map.setPaintProperty(layerIds.fill, 'fill-opacity', 0.4);
}

/**
 * Reset boundary choropleth to default static fill color
 */
export function resetBoundaryChoropleth(
  map: MaplibreMap,
  boundaryType: BoundaryType
): void {
  const config = BOUNDARY_CONFIGS[boundaryType];
  const layerIds = getBoundaryLayerIds(boundaryType);

  if (!map.getLayer(layerIds.fill)) {
    return;
  }

  // Reset to static fill color
  map.setPaintProperty(layerIds.fill, 'fill-color', config.colors.fill);
  map.setPaintProperty(layerIds.fill, 'fill-opacity', 0.1);
}
