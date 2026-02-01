'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG } from '@/lib/maplibre';
import { addOIMToMapAsync, type OIMStatus } from '@/lib/oim';
import { initializeOIMSymbols, clearOIMSymbolsCache } from '@/lib/oim-symbols';
import { BoundarySelector } from '@/components/filters/BoundarySelector';
import { LayerControl } from '@/components/filters/LayerControl';
import { MapStyleSelector } from '@/components/filters/MapStyleSelector';
import { InvestmentLayer } from '@/components/map/InvestmentLayer';
import { useInfrastructurePopup } from '@/hooks/useInfrastructurePopup';

interface MapProps {
  className?: string;
  onMapLoad?: (map: MaplibreMap) => void;
  /** Whether a tour is currently active (hides controls on mobile) */
  isTourActive?: boolean;
}

export function Map({ className = '', onMapLoad, isTourActive = false }: MapProps) {
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

      // Add attribution - always start collapsed
      mapInstance.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      // Force attribution to be collapsed after a short delay
      // This ensures it's collapsed even if MapLibre opens it by default on mobile
      setTimeout(() => {
        const attribBtn = container.querySelector('.maplibregl-ctrl-attrib-button');
        const attribContainer = container.querySelector('.maplibregl-ctrl-attrib');
        if (attribBtn && attribContainer) {
          attribContainer.classList.remove('maplibregl-compact-show');
          attribBtn.setAttribute('aria-expanded', 'false');
        }
      }, 100);

      mapInstance.on('load', async () => {
        console.log('[Map] Style loaded successfully');
        mapInstance.resize();

        // Initialize OIM symbol loader for icon loading
        const cleanupSymbols = initializeOIMSymbols(mapInstance);
        console.log('[Map] OIM symbol loader initialized');

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

        // Store cleanup function for later
        (mapInstance as unknown as { _cleanupSymbols?: () => void })._cleanupSymbols = cleanupSymbols;

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
        // Cleanup OIM symbol loader
        const cleanupFn = (mapInstance as unknown as { _cleanupSymbols?: () => void })._cleanupSymbols;
        if (cleanupFn) cleanupFn();
        clearOIMSymbolsCache();
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

      {/* Boundary selector overlay - hidden on mobile during tours */}
      {isLoaded && <BoundarySelector map={map} isTourActive={isTourActive} />}

      {/* Layer control overlay */}
      {isLoaded && <LayerControl map={map} />}

      {/* Map style selector */}
      {isLoaded && <MapStyleSelector map={map} />}

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
