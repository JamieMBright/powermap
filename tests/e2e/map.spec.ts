import { test, expect } from '@playwright/test';
import {
  waitForMapLoad,
  zoomIn,
  zoomOut,
  MOBILE_VIEWPORT,
  DESKTOP_VIEWPORT,
} from './helpers';

test.describe('Map Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('map loads successfully', async ({ page }) => {
    // Wait for map container to be present
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

    // Wait for loading overlay to disappear
    await waitForMapLoad(page);

    // Verify the map canvas is rendered
    await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  });

  test('map shows OIM power line layers', async ({ page }) => {
    await waitForMapLoad(page);

    // OIM layers are added after map load
    // Check that the MapLibre container is properly initialized
    const mapCanvas = page.locator('.maplibregl-canvas');
    await expect(mapCanvas).toBeVisible();

    // Verify the map has loaded by checking for MapLibre attribution
    await expect(page.locator('.maplibregl-ctrl-attrib')).toBeVisible();

    // The OIM layers are added dynamically - we verify by checking
    // the map style contains our expected source
    const hasOIMSource = await page.evaluate(() => {
      const canvas = document.querySelector('.maplibregl-canvas');
      if (!canvas) return false;
      // MapLibre stores map instance on canvas
      const mapInstance = Object.values(canvas).find(
        (v) => v && typeof v === 'object' && 'getStyle' in v
      );
      if (!mapInstance || typeof mapInstance !== 'object') return false;
      const style = (mapInstance as { getStyle: () => { sources?: Record<string, unknown> } }).getStyle();
      return style.sources && 'oim-power' in style.sources;
    });
    expect(hasOIMSource).toBe(true);
  });

  test('navigation controls work (zoom in/out)', async ({ page }) => {
    await waitForMapLoad(page);

    // Get initial zoom level
    const getZoom = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('.maplibregl-canvas');
        if (!canvas) return 0;
        const mapInstance = Object.values(canvas).find(
          (v) => v && typeof v === 'object' && 'getZoom' in v
        );
        if (!mapInstance || typeof mapInstance !== 'object') return 0;
        return (mapInstance as { getZoom: () => number }).getZoom();
      });

    const initialZoom = await getZoom();

    // Click zoom in button
    await zoomIn(page);
    await page.waitForTimeout(500); // Wait for zoom animation

    const zoomedInLevel = await getZoom();
    expect(zoomedInLevel).toBeGreaterThan(initialZoom);

    // Click zoom out button
    await zoomOut(page);
    await page.waitForTimeout(500); // Wait for zoom animation

    const zoomedOutLevel = await getZoom();
    expect(zoomedOutLevel).toBeLessThan(zoomedInLevel);
  });

  test('map is responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');

    await waitForMapLoad(page);

    // Verify map container fills the viewport
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Get container dimensions
    const containerBox = await mapContainer.boundingBox();
    expect(containerBox).not.toBeNull();
    if (containerBox) {
      // Map should fill most of the viewport
      expect(containerBox.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.9);
      expect(containerBox.height).toBeGreaterThan(MOBILE_VIEWPORT.height * 0.5);
    }

    // Verify navigation controls are present
    await expect(page.locator('.maplibregl-ctrl-zoom-in')).toBeVisible();
    await expect(page.locator('.maplibregl-ctrl-zoom-out')).toBeVisible();
  });

  test('map displays scale control', async ({ page }) => {
    await waitForMapLoad(page);

    // Scale control should be visible
    await expect(page.locator('.maplibregl-ctrl-scale')).toBeVisible();
  });

  test('map centers on UK on initial load', async ({ page }) => {
    await waitForMapLoad(page);

    // Get map center
    const center = await page.evaluate(() => {
      const canvas = document.querySelector('.maplibregl-canvas');
      if (!canvas) return null;
      const mapInstance = Object.values(canvas).find(
        (v) => v && typeof v === 'object' && 'getCenter' in v
      );
      if (!mapInstance || typeof mapInstance !== 'object') return null;
      const c = (mapInstance as { getCenter: () => { lng: number; lat: number } }).getCenter();
      return { lng: c.lng, lat: c.lat };
    });

    expect(center).not.toBeNull();
    if (center) {
      // UK is roughly around -1 to 0 longitude, 51 to 53 latitude
      expect(center.lng).toBeGreaterThan(-5);
      expect(center.lng).toBeLessThan(3);
      expect(center.lat).toBeGreaterThan(50);
      expect(center.lat).toBeLessThan(56);
    }
  });
});
