'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Map as MaplibreMap, Popup, GeoJSONSource } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import type { AssetInvestment, InvestmentDriver } from '@/data/types';
import {
  useInvestmentData,
  useInvestmentDrivers,
  type InvestmentDriverMeta,
} from '@/hooks/useInvestmentData';
import { useYearFilter } from '@/hooks/useYearFilter';
import { MAP_STYLE_CHANGE_EVENT } from '@/components/filters/MapStyleSelector';

// Layer and source IDs
const INVESTMENT_SOURCE_ID = 'investment-data';
const INVESTMENT_LAYER_ID = 'investment-circles';
const INVESTMENT_LABELS_LAYER_ID = 'investment-labels';

// Default colors if metadata fails to load
const DEFAULT_DRIVER_COLORS: Record<InvestmentDriver, string> = {
  asset_replacement: '#3B82F6',
  load_reinforcement: '#22C55E',
  proactive_investment: '#8B5CF6',
  fault_level: '#F59E0B',
  reverse_power_flow: '#EF4444',
  connections: '#06B6D4',
};

// Driver names for display
const DRIVER_NAMES: Record<InvestmentDriver, string> = {
  asset_replacement: 'Asset Replacement',
  load_reinforcement: 'Load Reinforcement',
  proactive_investment: 'Proactive Investment',
  fault_level: 'Fault Level',
  reverse_power_flow: 'Reverse Power Flow',
  connections: 'Connections',
};

// Asset type names for display
const ASSET_TYPE_NAMES: Record<string, string> = {
  substation: 'Substation',
  transformer: 'Transformer',
  cable: 'Cable',
  overhead_line: 'Overhead Line',
  switchgear: 'Switchgear',
};

interface InvestmentLayerProps {
  map: MaplibreMap | null;
  boundaryType?: string;
  boundaryCode?: string;
}

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `£${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `£${(amount / 1000).toFixed(0)}K`;
  }
  return `£${amount.toLocaleString()}`;
}

/**
 * Calculate circle radius based on investment amount
 * Uses square root scaling for better visual balance
 */
function getCircleRadius(amount: number): number {
  const minRadius = 6;
  const maxRadius = 30;
  const minAmount = 500000; // 500K
  const maxAmount = 100000000; // 100M

  // Normalize using log scale for better distribution
  const normalizedAmount = Math.max(minAmount, Math.min(maxAmount, amount));
  const logMin = Math.log(minAmount);
  const logMax = Math.log(maxAmount);
  const logAmount = Math.log(normalizedAmount);

  const scale = (logAmount - logMin) / (logMax - logMin);
  return minRadius + scale * (maxRadius - minRadius);
}

/**
 * Convert investments to GeoJSON for MapLibre
 */
function investmentsToGeoJSON(
  investments: AssetInvestment[],
  driverColors: Record<string, string>
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: investments.map((inv) => ({
      type: 'Feature' as const,
      id: inv.id,
      geometry: {
        type: 'Point' as const,
        coordinates: [inv.location.lng, inv.location.lat],
      },
      properties: {
        id: inv.id,
        year: inv.year,
        amount: inv.investment.amount,
        driver: inv.investment.driver,
        assetType: inv.investment.type,
        projectName: inv.metadata.projectName || 'Unnamed Project',
        description: inv.metadata.description || '',
        color: driverColors[inv.investment.driver] || DEFAULT_DRIVER_COLORS[inv.investment.driver as InvestmentDriver] || '#888888',
        radius: getCircleRadius(inv.investment.amount),
        // Boundary info for filtering
        resp: inv.boundaries.resp,
        gsp: inv.boundaries.gsp,
        la: inv.boundaries.la,
        lsoa: inv.boundaries.lsoa,
      },
    })),
  };
}

/**
 * Create popup HTML content for an investment
 */
function createPopupContent(properties: Record<string, unknown>): string {
  const driver = properties.driver as InvestmentDriver;
  const driverName = DRIVER_NAMES[driver] || driver;
  const assetType = properties.assetType as string;
  const assetTypeName = ASSET_TYPE_NAMES[assetType] || assetType;
  const color = properties.color as string;

  return `
    <div class="investment-popup" style="min-width: 220px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${color};
          flex-shrink: 0;
        "></span>
        <span style="
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        ">${driverName}</span>
      </div>

      <h3 style="
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 8px 0;
        line-height: 1.3;
      ">${properties.projectName}</h3>

      <div style="
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: #374151;
      ">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Investment:</span>
          <span style="font-weight: 600; color: #059669;">${formatCurrency(properties.amount as number)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Asset Type:</span>
          <span style="font-weight: 500;">${assetTypeName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Year:</span>
          <span style="font-weight: 500;">${properties.year}</span>
        </div>
      </div>

      ${properties.description ? `
        <p style="
          font-size: 12px;
          color: #6b7280;
          margin: 10px 0 0 0;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          line-height: 1.4;
        ">${properties.description}</p>
      ` : ''}
    </div>
  `;
}

export function InvestmentLayer({ map, boundaryType, boundaryCode }: InvestmentLayerProps) {
  const { year } = useYearFilter();
  const { investments, isLoading, error } = useInvestmentData(year, {
    boundaryType: boundaryType as 'resp' | 'gsp' | 'la' | 'lsoa' | undefined,
    boundaryCode,
  });
  const { drivers: driversMetadata } = useInvestmentDrivers();

  const popupRef = useRef<Popup | null>(null);
  const [isLayerAdded, setIsLayerAdded] = useState(false);

  // Get driver colors from metadata or use defaults
  const driverColors = useCallback((): Record<string, string> => {
    if (driversMetadata?.drivers) {
      return Object.entries(driversMetadata.drivers).reduce(
        (acc, [key, meta]) => {
          acc[key] = (meta as InvestmentDriverMeta).color;
          return acc;
        },
        {} as Record<string, string>
      );
    }
    return DEFAULT_DRIVER_COLORS;
  }, [driversMetadata]);

  // Initialize layer on map
  const initializeLayer = useCallback(() => {
    if (!map) return;

    // Add source if it doesn't exist
    if (!map.getSource(INVESTMENT_SOURCE_ID)) {
      map.addSource(INVESTMENT_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    // Add circle layer for investments (hidden by default - use choropleth for visualization)
    if (!map.getLayer(INVESTMENT_LAYER_ID)) {
      map.addLayer({
        id: INVESTMENT_LAYER_ID,
        type: 'circle',
        source: INVESTMENT_SOURCE_ID,
        layout: {
          // Hidden by default - investment data shown via boundary choropleth
          'visibility': 'none',
        },
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9,
        },
      });

      // Add labels layer for larger investments (hidden by default)
      map.addLayer({
        id: INVESTMENT_LABELS_LAYER_ID,
        type: 'symbol',
        source: INVESTMENT_SOURCE_ID,
        filter: ['>=', ['get', 'amount'], 10000000], // Only show labels for investments >= 10M
        layout: {
          // Hidden by default - investment data shown via boundary choropleth
          'visibility': 'none',
          'text-field': ['get', 'projectName'],
          'text-size': 11,
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-max-width': 12,
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      setIsLayerAdded(true);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // If map is already loaded, initialize immediately
    if (map.isStyleLoaded()) {
      initializeLayer();
    } else {
      // Wait for style to load
      map.once('styledata', initializeLayer);
    }

    return () => {
      // Cleanup on unmount
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [map, initializeLayer]);

  // Re-add investment layers after map style change
  useEffect(() => {
    if (!map) return;

    const handleStyleChange = () => {
      // Check if the source was removed (it would be after a style change)
      if (!map.getSource(INVESTMENT_SOURCE_ID)) {
        console.log('[InvestmentLayer] Re-adding layers after style change');
        setIsLayerAdded(false);
        initializeLayer();
        // Re-populate with current data
        const source = map.getSource(INVESTMENT_SOURCE_ID) as GeoJSONSource | undefined;
        if (source && investments.length > 0) {
          const geojson = investmentsToGeoJSON(investments, driverColors());
          source.setData(geojson);
        }
      }
    };

    window.addEventListener(MAP_STYLE_CHANGE_EVENT, handleStyleChange);
    return () => {
      window.removeEventListener(MAP_STYLE_CHANGE_EVENT, handleStyleChange);
    };
  }, [map, initializeLayer, investments, driverColors]);

  // Update data when investments change
  useEffect(() => {
    if (!map || !isLayerAdded) return;

    const source = map.getSource(INVESTMENT_SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      const geojson = investmentsToGeoJSON(investments, driverColors());
      source.setData(geojson);
    }
  }, [map, investments, isLayerAdded, driverColors]);

  // Handle click events
  useEffect(() => {
    if (!map || !isLayerAdded) return;

    const handleClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const properties = feature.properties;

      if (!properties) return;

      // Ensure popup appears at the correct location when map is zoomed out
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // Remove existing popup
      if (popupRef.current) {
        popupRef.current.remove();
      }

      // Create new popup
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px',
        className: 'investment-popup-container',
      })
        .setLngLat(coordinates)
        .setHTML(createPopupContent(properties))
        .addTo(map);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', INVESTMENT_LAYER_ID, handleClick);
    map.on('mouseenter', INVESTMENT_LAYER_ID, handleMouseEnter);
    map.on('mouseleave', INVESTMENT_LAYER_ID, handleMouseLeave);

    return () => {
      map.off('click', INVESTMENT_LAYER_ID, handleClick);
      map.off('mouseenter', INVESTMENT_LAYER_ID, handleMouseEnter);
      map.off('mouseleave', INVESTMENT_LAYER_ID, handleMouseLeave);
    };
  }, [map, isLayerAdded]);

  // Render loading/error states (optional - can be used for debugging)
  if (error) {
    console.error('Investment layer error:', error);
  }

  if (isLoading) {
    // Data is loading, layer will update when ready
    return null;
  }

  // This component doesn't render any visible elements directly
  // It manages the MapLibre layer
  return null;
}

export { InvestmentLayer as default };
