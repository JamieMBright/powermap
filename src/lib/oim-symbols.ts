import type { Map as MaplibreMap } from 'maplibre-gl';

/**
 * OIM Symbol Loader
 *
 * Handles on-demand loading of power infrastructure icons for OpenInfraMap layers.
 * This mimics the approach used by OpenInfraMap's web application.
 */

// Icon manifest - maps icon IDs to their file paths
const ICON_MANIFEST: Record<string, string> = {
  'power_wind': '/icons/oim/power_wind.svg',
  'power_generator_solar': '/icons/oim/power_generator_solar.svg',
  'power_generator': '/icons/oim/power_generator.svg',
  'power_transformer': '/icons/oim/power_transformer.svg',
  'power_tower': '/icons/oim/power_tower.svg',
  'power_pole': '/icons/oim/power_pole.svg',
  'power_switch': '/icons/oim/power_switch.svg',
  'power_compensator': '/icons/oim/power_compensator.svg',
  'power_plant': '/icons/oim/power_plant.svg',
  'power_substation': '/icons/oim/power_substation.svg',
  'converter': '/icons/oim/converter.svg',
};

// Track which icons have been loaded to prevent duplicate requests
const loadedIcons = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

/**
 * Load a single icon into the map
 */
async function loadIcon(map: MaplibreMap, iconId: string): Promise<void> {
  // Check if already loaded
  if (loadedIcons.has(iconId) || map.hasImage(iconId)) {
    return;
  }

  // Check if load is already pending
  const pending = pendingLoads.get(iconId);
  if (pending) {
    return pending;
  }

  const iconPath = ICON_MANIFEST[iconId];
  if (!iconPath) {
    console.warn(`[OIM Symbols] Unknown icon: ${iconId}`);
    return;
  }

  // Create load promise
  const loadPromise = new Promise<void>((resolve, reject) => {
    const img = new Image();

    // Determine if we need high-DPI version
    const pixelRatio = window.devicePixelRatio || 1;

    img.onload = () => {
      try {
        if (!map.hasImage(iconId)) {
          map.addImage(iconId, img, {
            pixelRatio: pixelRatio > 1 ? 2 : 1,
            sdf: false, // Icons are not SDF (signed distance field)
          });
          loadedIcons.add(iconId);
          console.log(`[OIM Symbols] Loaded icon: ${iconId}`);
        }
        resolve();
      } catch (error) {
        console.error(`[OIM Symbols] Failed to add image ${iconId}:`, error);
        reject(error);
      }
    };

    img.onerror = () => {
      console.error(`[OIM Symbols] Failed to load icon: ${iconPath}`);
      reject(new Error(`Failed to load icon: ${iconPath}`));
    };

    img.src = iconPath;
  });

  pendingLoads.set(iconId, loadPromise);

  try {
    await loadPromise;
  } finally {
    pendingLoads.delete(iconId);
  }
}

/**
 * Handle styleimagemissing event to load icons on demand
 */
function handleMissingImage(map: MaplibreMap, e: { id: string }): void {
  const iconId = e.id;

  // Only handle OIM icons
  if (iconId in ICON_MANIFEST) {
    loadIcon(map, iconId).catch((error) => {
      console.error(`[OIM Symbols] Failed to load missing icon ${iconId}:`, error);
    });
  }
}

/**
 * Preload commonly used icons
 */
async function preloadIcons(map: MaplibreMap, iconIds: string[]): Promise<void> {
  const loadPromises = iconIds
    .filter(id => id in ICON_MANIFEST)
    .map(id => loadIcon(map, id));

  await Promise.allSettled(loadPromises);
}

/**
 * Initialize the symbol loader for a map
 * Sets up the styleimagemissing handler and preloads common icons
 */
export function initializeOIMSymbols(map: MaplibreMap): () => void {
  // Create bound handler
  const handler = (e: { id: string }) => handleMissingImage(map, e);

  // Listen for missing images
  map.on('styleimagemissing', handler);

  // Preload commonly used icons
  const commonIcons = [
    'power_tower',
    'power_pole',
    'power_substation',
    'power_transformer',
    'power_wind',
    'power_generator_solar',
    'power_generator',
  ];

  preloadIcons(map, commonIcons).catch(error => {
    console.error('[OIM Symbols] Failed to preload icons:', error);
  });

  // Return cleanup function
  return () => {
    map.off('styleimagemissing', handler);
  };
}

/**
 * Clear loaded icons cache (useful when map style changes)
 */
export function clearOIMSymbolsCache(): void {
  loadedIcons.clear();
  pendingLoads.clear();
}

/**
 * Get list of available icon IDs
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MANIFEST);
}

/**
 * Check if an icon is available
 */
export function hasIcon(iconId: string): boolean {
  return iconId in ICON_MANIFEST;
}

// Export for testing
export { ICON_MANIFEST, loadIcon, preloadIcons };
