'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG } from '@/lib/maplibre';
import { addOIMToMapAsync, type OIMStatus } from '@/lib/oim';
import { BoundarySelector } from '@/components/filters/BoundarySelector';
import { LayerControl } from '@/components/filters/LayerControl';
import { InvestmentLayer } from '@/components/map/InvestmentLayer';
import { useInfrastructurePopup } from '@/hooks/useInfrastructurePopup';

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
  const [initAttempt, setInitAttempt] = useState(0);
  const [oimStatus, setOimStatus] = useState<OIMStatus>('loading');
  const [oimError, setOimError] = useState<string | undefined>();

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

  // Enable click popups for infrastructure features
  useInfrastructurePopup(map);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const container = mapContainer.current;
    const rect = container.getBoundingClientRect();
    console.log('[Map] Container dimensions:', rect.width, 'x', rect.height);

    // Retry if container has zero dimensions (can happen during initial render)
    if (rect.width === 0 || rect.height === 0) {
      if (initAttempt < 10) {
        console.warn('[Map] Container has zero dimensions, retrying...');
        const timer = setTimeout(() => setInitAttempt(n => n + 1), 100);
        return () => clearTimeout(timer);
      }
      console.error('[Map] Container still has zero dimensions after retries!');
      return;
    }

    try {
      console.log('[Map] Creating MapLibre instance...');
      const mapInstance = new maplibregl.Map({
        container: container,
        style: MAP_CONFIG.style,
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        touchZoomRotate: true,
        touchPitch: true,
        dragRotate: false,
        attributionControl: false,
      });

      console.log('[Map] MapLibre instance created');

      // Add navigation controls with zoom +/- buttons
      mapInstance.addControl(
        new maplibregl.NavigationControl({ showCompass: !isMobile }),
        isMobile ? 'bottom-right' : 'top-right'
      );

      // Add scale control
      mapInstance.addControl(
        new maplibregl.ScaleControl({ unit: 'metric' }),
        'bottom-left'
      );

      // Add fullscreen control - only on desktop
      if (!isMobile) {
        mapInstance.addControl(new maplibregl.FullscreenControl(), 'top-right');
      }

      // Add geolocate control
      mapInstance.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
        }),
        isMobile ? 'bottom-right' : 'top-right'
      );

      // Add attribution
      mapInstance.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      mapInstance.on('load', async () => {
        console.log('[Map] Style loaded successfully');
        mapInstance.resize();

        // Load OIM layers with status tracking
        setOimStatus('loading');
        try {
          const result = await addOIMToMapAsync(mapInstance, (status, error) => {
            setOimStatus(status);
            setOimError(error);
          });
          console.log('[Map] OIM load result:', result);
        } catch (err) {
          console.error('[Map] Failed to load OIM layers:', err);
          setOimStatus('error');
          setOimError(err instanceof Error ? err.message : 'Unknown error');
        }

        setIsLoaded(true);
        handleMapLoad(mapInstance);
      });

      mapInstance.on('error', (e) => {
        console.error('[Map] Error:', e.error?.message || e);
      });

      // Handle container resize
      const resizeObserver = new ResizeObserver(() => {
        mapInstance.resize();
      });
      resizeObserver.observe(container);

      mapRef.current = mapInstance;

      return () => {
        resizeObserver.disconnect();
        mapInstance.remove();
        mapRef.current = null;
        setMap(null);
      };
    } catch (err) {
      console.error('[Map] Failed to create map:', err);
    }
  }, [handleMapLoad, isMobile, initAttempt]);

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

      {/* Layer control overlay */}
      {isLoaded && <LayerControl map={map} />}

      {!isLoaded && (
        <div data-testid="map-loading" className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* OIM Status Indicator */}
      {isLoaded && (oimStatus === 'error' || oimStatus === 'unavailable') && (
        <div
          data-testid="oim-status"
          className="absolute top-2 left-2 z-20 bg-amber-100 border border-amber-300 rounded-md px-3 py-2 shadow-sm max-w-xs"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Infrastructure overlay unavailable
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {oimError || 'Power lines and substations may not be visible'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Map as default };
