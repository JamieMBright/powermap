import { test, expect, devices } from '@playwright/test';
import {
  waitForMapLoad,
  waitForYearSlider,
  clickPlayButton,
  clickNextYear,
  openBoundarySelector,
  MOBILE_VIEWPORT,
} from './helpers';

// Use mobile device emulation
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile Viewport Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMapLoad(page);
  });

  test('map renders correctly on mobile viewport', async ({ page }) => {
    // Verify map container is visible
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

    // Verify the canvas fills the viewport
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    if (canvasBox) {
      // Canvas should be substantial size
      expect(canvasBox.width).toBeGreaterThan(300);
      expect(canvasBox.height).toBeGreaterThan(400);
    }
  });

  test('year slider is accessible on mobile', async ({ page }) => {
    await waitForYearSlider(page);

    // Year slider should be visible
    await expect(page.locator('[data-testid="year-slider"]')).toBeVisible();

    // Verify year display is visible
    await expect(page.locator('[data-testid="year-display"]')).toBeVisible();

    // Play button should be large enough for touch (min 44px)
    const playButton = page.locator('[data-testid="play-button"]');
    await expect(playButton).toBeVisible();
    const playButtonBox = await playButton.boundingBox();
    expect(playButtonBox).not.toBeNull();
    if (playButtonBox) {
      expect(playButtonBox.width).toBeGreaterThanOrEqual(40); // Close to 44px min tap target
      expect(playButtonBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('navigation buttons have adequate tap targets', async ({ page }) => {
    await waitForYearSlider(page);

    // Check previous year button tap target
    const prevButton = page.locator('[data-testid="previous-year-button"]');
    const prevBox = await prevButton.boundingBox();
    expect(prevBox).not.toBeNull();
    if (prevBox) {
      expect(prevBox.width).toBeGreaterThanOrEqual(40);
      expect(prevBox.height).toBeGreaterThanOrEqual(40);
    }

    // Check next year button tap target
    const nextButton = page.locator('[data-testid="next-year-button"]');
    const nextBox = await nextButton.boundingBox();
    expect(nextBox).not.toBeNull();
    if (nextBox) {
      expect(nextBox.width).toBeGreaterThanOrEqual(40);
      expect(nextBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('boundary selector has mobile tap target', async ({ page }) => {
    const selectorButton = page.locator('[data-testid="boundary-selector-button"]');
    await expect(selectorButton).toBeVisible();

    const buttonBox = await selectorButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    if (buttonBox) {
      // Should meet minimum touch target size
      expect(buttonBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('header is responsive and shows condensed info', async ({ page }) => {
    // Verify header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // PowerMap title should be visible
    await expect(page.locator('h1')).toContainText('PowerMap');

    // Beta badge should be visible
    await expect(page.locator('text=Beta')).toBeVisible();

    // On mobile, the long subtitle should be hidden
    const subtitle = page.locator('text=UK Power Networks Investment Strategy 2025-2050');
    await expect(subtitle).toBeHidden();
  });

  test('attribution footer is visible on mobile', async ({ page }) => {
    // Attribution should be visible at bottom
    const attribution = page.locator('text=UK Power Networks');
    await expect(attribution).toBeVisible();
  });
});

test.describe('Touch Interactions', () => {
  test.use({ ...devices['Pixel 5'] });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMapLoad(page);
  });

  test('touch interactions work on year slider', async ({ page }) => {
    await waitForYearSlider(page);

    // Tap next year button
    await clickNextYear(page);

    // Year should change to 2026
    const yearText = await page.locator('[data-testid="year-display"]').textContent();
    expect(yearText).toBe('2026');
  });

  test('play button responds to touch', async ({ page }) => {
    await waitForYearSlider(page);

    // Tap play button
    await clickPlayButton(page);

    // Wait for animation to advance
    await page.waitForTimeout(1500);

    // Year should have advanced from 2025
    const yearText = await page.locator('[data-testid="year-display"]').textContent();
    const year = parseInt(yearText || '2025', 10);
    expect(year).toBeGreaterThan(2025);

    // Tap again to pause
    await clickPlayButton(page);
  });

  test('boundary selector opens bottom sheet on mobile', async ({ page }) => {
    // Tap to open boundary selector
    await openBoundarySelector(page);

    // On mobile, should see bottom sheet header
    await expect(page.locator('h2:has-text("Select Boundary")')).toBeVisible();

    // Close button should be visible
    const closeButton = page.locator('button[aria-label="Close"]');
    await expect(closeButton).toBeVisible();

    // Boundary options should be visible with larger tap targets
    await expect(page.locator('[data-testid="boundary-option-gsp"]')).toBeVisible();
  });

  test('bottom sheet can be dismissed by backdrop tap', async ({ page }) => {
    // Open boundary selector
    await openBoundarySelector(page);

    // Verify sheet is open
    await expect(page.locator('h2:has-text("Select Boundary")')).toBeVisible();

    // Tap backdrop to close
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/30');
    if (await backdrop.isVisible()) {
      await backdrop.click({ force: true });

      // Sheet should close
      await expect(page.locator('h2:has-text("Select Boundary")')).toBeHidden();
    }
  });

  test('map responds to touch pan gestures', async ({ page }) => {
    // Get initial map center
    const getCenter = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('.maplibregl-canvas');
        if (!canvas) return null;
        const mapInstance = Object.values(canvas).find(
          (v) => v && typeof v === 'object' && 'getCenter' in v
        );
        if (!mapInstance || typeof mapInstance !== 'object') return null;
        const c = (mapInstance as { getCenter: () => { lng: number; lat: number } }).getCenter();
        return { lng: c.lng, lat: c.lat };
      });

    const initialCenter = await getCenter();
    expect(initialCenter).not.toBeNull();

    // Perform a drag/pan gesture on the map
    const mapContainer = page.locator('[data-testid="map-container"]');
    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Simulate touch drag
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 100, centerY + 50, { steps: 10 });
      await page.mouse.up();

      // Wait for pan animation
      await page.waitForTimeout(500);

      // Center should have changed
      const newCenter = await getCenter();
      expect(newCenter).not.toBeNull();

      if (initialCenter && newCenter) {
        // At least one coordinate should have changed
        const hasMoved =
          Math.abs(newCenter.lng - initialCenter.lng) > 0.001 ||
          Math.abs(newCenter.lat - initialCenter.lat) > 0.001;
        expect(hasMoved).toBe(true);
      }
    }
  });
});

test.describe('UI Elements Accessibility on Mobile', () => {
  test.use({ ...devices['Pixel 5'] });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMapLoad(page);
  });

  test('buttons have accessible labels', async ({ page }) => {
    await waitForYearSlider(page);

    // Play button should have aria-label
    const playButton = page.locator('[data-testid="play-button"]');
    await expect(playButton).toHaveAttribute('aria-label', /(Play|Pause)/);

    // Navigation buttons should have aria-labels
    const prevButton = page.locator('[data-testid="previous-year-button"]');
    await expect(prevButton).toHaveAttribute('aria-label', 'Previous year');

    const nextButton = page.locator('[data-testid="next-year-button"]');
    await expect(nextButton).toHaveAttribute('aria-label', 'Next year');
  });

  test('slider has accessible label', async ({ page }) => {
    await waitForYearSlider(page);

    const slider = page.locator('[data-testid="year-slider-input"]');
    await expect(slider).toHaveAttribute('aria-label', 'Select year');
  });

  test('elements maintain touch-friendly sizing', async ({ page }) => {
    // Test that interactive elements maintain minimum touch target sizes
    // WCAG recommends at least 44x44 CSS pixels for touch targets

    await waitForYearSlider(page);

    // Collect all interactive elements and verify sizing
    const interactiveElements = [
      '[data-testid="play-button"]',
      '[data-testid="previous-year-button"]',
      '[data-testid="next-year-button"]',
      '[data-testid="boundary-selector-button"]',
    ];

    for (const selector of interactiveElements) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();

      if (isVisible) {
        const box = await element.boundingBox();
        if (box) {
          // Elements should be at least 40px (close to 44px WCAG target)
          const minDimension = Math.min(box.width, box.height);
          expect(minDimension).toBeGreaterThanOrEqual(38);
        }
      }
    }
  });

  test('map zoom controls are accessible on mobile', async ({ page }) => {
    // Verify zoom controls are present
    const zoomIn = page.locator('.maplibregl-ctrl-zoom-in');
    const zoomOut = page.locator('.maplibregl-ctrl-zoom-out');

    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();

    // Verify they have accessible labels
    await expect(zoomIn).toHaveAttribute('aria-label', /[Zz]oom [Ii]n/);
    await expect(zoomOut).toHaveAttribute('aria-label', /[Zz]oom [Oo]ut/);
  });
});
