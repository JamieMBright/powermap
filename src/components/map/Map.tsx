'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG } from '@/lib/maplibre';
import { addOIMToMap } from '@/lib/oim';
import { BoundarySelector } from '@/components/filters/BoundarySelector';
import { InvestmentLayer } from '@/components/map/InvestmentLayer';

interface MapProps {
  className?: string;
  onMapLoad?: (map: MaplibreMap) => void;
}

export function Map({ className = '', onMapLoad }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState<MaplibreMap | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMapLoad = useCallback((loadedMap: MaplibreMap) => {
    setMap(loadedMap);
    onMapLoad?.(loadedMap);
  }, [onMapLoad]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      // Enable touch interactions
      touchZoomRotate: true,
      touchPitch: true,
      dragRotate: false, // Simpler interaction on mobile
    });

    // Add navigation controls - position differently on mobile to avoid overlap
    // On mobile, position bottom-right to avoid overlapping with BoundarySelector
    mapInstance.addControl(
      new maplibregl.NavigationControl({ showCompass: !isMobile }),
      isMobile ? 'bottom-right' : 'top-right'
    );

    // Add scale control
    mapInstance.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // Add fullscreen control - only on desktop
    if (!isMobile) {
      mapInstance.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    // Add geolocate control for mobile users
    mapInstance.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      isMobile ? 'bottom-right' : 'top-right'
    );

    mapInstance.on('load', () => {
      // Add Open Infrastructure Map layers
      addOIMToMap(mapInstance);

      setIsLoaded(true);
      handleMapLoad(mapInstance);
    });

    mapRef.current = mapInstance;

    return () => {
      mapInstance.remove();
      mapRef.current = null;
      setMap(null);
    };
  }, [handleMapLoad, isMobile]);

  // Use className if provided, otherwise default to relative full-size container
  // This allows parent to control positioning (absolute, fixed, etc.)
  const containerClasses = className || 'relative h-full w-full';

  return (
    <div className={containerClasses}>
      {/* Map container with touch-action for better mobile scrolling */}
      <div
        ref={mapContainer}
        data-testid="map-container"
        className="absolute inset-0 touch-manipulation"
        style={{ touchAction: 'manipulation' }}
      />

      {/* Investment data layer */}
      {isLoaded && <InvestmentLayer map={map} />}

      {/* Boundary selector overlay */}
      {isLoaded && <BoundarySelector map={map} />}

      {!isLoaded && (
        <div data-testid="map-loading" className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { Map as default };
