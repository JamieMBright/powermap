'use client';

/**
 * Map Diagnostic Page
 *
 * Use this page to debug map rendering issues.
 * Visit /debug/map in development to see diagnostic info.
 */

import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapDebugPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string[]>(['Initializing...']);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const addStatus = (msg: string) => {
    setStatus(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${msg}`]);
  };

  useEffect(() => {
    if (!mapContainer.current) {
      addStatus('ERROR: mapContainer ref is null');
      return;
    }

    // Check container dimensions
    const rect = mapContainer.current.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });
    addStatus(`Container dimensions: ${rect.width}x${rect.height}`);

    if (rect.width === 0 || rect.height === 0) {
      setError('Container has zero dimensions! The map needs a container with explicit width and height.');
      return;
    }

    addStatus('Creating MapLibre map instance...');

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-0.1, 51.5],
        zoom: 7,
      });

      addStatus('Map instance created');

      map.on('load', () => {
        addStatus('Map "load" event fired - map is ready!');
      });

      map.on('error', (e) => {
        addStatus(`Map error: ${e.error?.message || 'Unknown error'}`);
        setError(`Map error: ${e.error?.message || JSON.stringify(e)}`);
      });

      map.on('styledata', () => {
        addStatus('Style data loaded');
      });

      map.on('sourcedata', () => {
        addStatus('Source data loaded');
      });

      // Check if style loads
      setTimeout(() => {
        if (map.isStyleLoaded()) {
          addStatus('Style is loaded (checked after 2s)');
        } else {
          addStatus('WARNING: Style not loaded after 2s');
        }
      }, 2000);

      return () => {
        addStatus('Cleaning up map instance');
        map.remove();
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addStatus(`EXCEPTION: ${errMsg}`);
      setError(errMsg);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Map Debug Page</h1>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Container info */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-2">Container Info</h2>
        <p>Width: {containerSize.width}px</p>
        <p>Height: {containerSize.height}px</p>
        <p className={containerSize.width === 0 || containerSize.height === 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
          {containerSize.width === 0 || containerSize.height === 0
            ? '⚠️ Container has zero dimensions!'
            : '✓ Container has valid dimensions'}
        </p>
      </div>

      {/* Status log */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-2">Status Log</h2>
        <div className="font-mono text-sm bg-gray-900 text-green-400 p-3 rounded max-h-48 overflow-y-auto">
          {status.map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">Map Container</h2>
        <div
          ref={mapContainer}
          style={{ width: '100%', height: '400px' }}
          className="border-2 border-dashed border-gray-300 rounded"
        />
      </div>

      {/* CSS Check */}
      <div className="bg-white p-4 rounded shadow mt-4">
        <h2 className="font-bold mb-2">CSS Check</h2>
        <p>If you see a map above, the basic rendering works.</p>
        <p>If not, check the browser console (F12) for errors.</p>
        <p className="mt-2 text-sm text-gray-600">
          Common issues:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li>CORS blocking the style URL</li>
          <li>Container height is 0 (use explicit height, not just h-full)</li>
          <li>Parent element has no height</li>
          <li>maplibre-gl CSS not imported</li>
        </ul>
      </div>
    </div>
  );
}
