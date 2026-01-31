import { Page, expect } from '@playwright/test';

/**
 * Common test helpers for PowerMap E2E tests
 */

/**
 * Wait for the map to fully load with all layers
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 */
export async function waitForMapLoad(page: Page, timeout = 30000): Promise<void> {
  // Wait for the map container to be present
  await page.waitForSelector('[data-testid="map-container"]', { timeout });

  // Wait for the loading overlay to disappear
  await page.waitForSelector('[data-testid="map-loading"]', { state: 'hidden', timeout });
}

/**
 * Wait for the year slider component to be ready
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 */
export async function waitForYearSlider(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('[data-testid="year-slider"]', { timeout });
}

/**
 * Get the current year displayed in the slider
 * @param page - Playwright page object
 * @returns The current year as a number
 */
export async function getCurrentYear(page: Page): Promise<number> {
  const yearText = await page.locator('[data-testid="year-display"]').textContent();
  return parseInt(yearText ?? '2025', 10);
}

/**
 * Set the year using the slider
 * @param page - Playwright page object
 * @param year - The year to set (2025-2050)
 */
export async function setYear(page: Page, year: number): Promise<void> {
  const slider = page.locator('[data-testid="year-slider-input"]');
  await slider.fill(year.toString());
}

/**
 * Click the play button to start animation
 * @param page - Playwright page object
 */
export async function clickPlayButton(page: Page): Promise<void> {
  await page.locator('[data-testid="play-button"]').click();
}

/**
 * Click the next year button
 * @param page - Playwright page object
 */
export async function clickNextYear(page: Page): Promise<void> {
  await page.locator('[data-testid="next-year-button"]').click();
}

/**
 * Click the previous year button
 * @param page - Playwright page object
 */
export async function clickPreviousYear(page: Page): Promise<void> {
  await page.locator('[data-testid="previous-year-button"]').click();
}

/**
 * Open the boundary selector dropdown
 * @param page - Playwright page object
 */
export async function openBoundarySelector(page: Page): Promise<void> {
  await page.locator('[data-testid="boundary-selector-button"]').click();
}

/**
 * Select a boundary type
 * @param page - Playwright page object
 * @param boundaryType - The boundary type to select (e.g., 'gsp', 'bsp', 'dno')
 */
export async function selectBoundary(page: Page, boundaryType: string): Promise<void> {
  await openBoundarySelector(page);
  await page.locator(`[data-testid="boundary-option-${boundaryType}"]`).click();
}

/**
 * Check if a map layer exists and is visible
 * @param page - Playwright page object
 * @param layerId - The MapLibre layer ID to check
 * @returns True if the layer exists
 */
export async function hasMapLayer(page: Page, layerId: string): Promise<boolean> {
  return await page.evaluate((id) => {
    const mapElement = document.querySelector('[data-testid="map-container"]');
    if (!mapElement) return false;
    // Access the map instance through the window object (if exposed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstance = (window as any).__powermap_instance;
    if (!mapInstance) return false;
    return mapInstance.getLayer(id) !== undefined;
  }, layerId);
}

/**
 * Get the current zoom level of the map
 * @param page - Playwright page object
 * @returns The current zoom level
 */
export async function getMapZoom(page: Page): Promise<number> {
  return await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstance = (window as any).__powermap_instance;
    if (!mapInstance) return 0;
    return mapInstance.getZoom();
  });
}

/**
 * Zoom in on the map using navigation controls
 * @param page - Playwright page object
 */
export async function zoomIn(page: Page): Promise<void> {
  await page.locator('.maplibregl-ctrl-zoom-in').click();
}

/**
 * Zoom out on the map using navigation controls
 * @param page - Playwright page object
 */
export async function zoomOut(page: Page): Promise<void> {
  await page.locator('.maplibregl-ctrl-zoom-out').click();
}

/**
 * Check if the URL contains the expected year parameter
 * @param page - Playwright page object
 * @param year - The expected year
 */
export async function expectYearInUrl(page: Page, year: number): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`year=${year}`));
}

/**
 * Mobile viewport dimensions
 */
export const MOBILE_VIEWPORT = { width: 375, height: 667 };

/**
 * Tablet viewport dimensions
 */
export const TABLET_VIEWPORT = { width: 768, height: 1024 };

/**
 * Desktop viewport dimensions
 */
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

/**
 * Set the viewport to mobile dimensions
 * @param page - Playwright page object
 */
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize(MOBILE_VIEWPORT);
}

/**
 * Set the viewport to desktop dimensions
 * @param page - Playwright page object
 */
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize(DESKTOP_VIEWPORT);
}

/**
 * Perform a pinch-to-zoom gesture on mobile
 * @param page - Playwright page object
 * @param scale - The scale factor (< 1 to zoom out, > 1 to zoom in)
 */
export async function pinchZoom(page: Page, scale: number): Promise<void> {
  const mapContainer = page.locator('[data-testid="map-container"]');
  const box = await mapContainer.boundingBox();
  if (!box) return;

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Simulate pinch gesture using mouse wheel with ctrl key
  await page.mouse.move(centerX, centerY);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, scale > 1 ? -100 : 100);
  await page.keyboard.up('Control');
}
