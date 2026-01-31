import { test, expect } from '@playwright/test';
import {
  waitForMapLoad,
  waitForYearSlider,
  getCurrentYear,
  clickPlayButton,
  clickNextYear,
  clickPreviousYear,
  expectYearInUrl,
} from './helpers';

test.describe('Year Slider Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMapLoad(page);
  });

  test('year slider renders', async ({ page }) => {
    await waitForYearSlider(page);

    // Verify year slider is visible
    await expect(page.locator('[data-testid="year-slider"]')).toBeVisible();

    // Verify year display shows initial year (2025)
    await expect(page.locator('[data-testid="year-display"]')).toBeVisible();
    const year = await getCurrentYear(page);
    expect(year).toBe(2025);

    // Verify play button is present
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible();

    // Verify navigation buttons are present
    await expect(page.locator('[data-testid="previous-year-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-year-button"]')).toBeVisible();

    // Verify slider input is present
    await expect(page.locator('[data-testid="year-slider-input"]')).toBeVisible();
  });

  test('dragging slider changes year display', async ({ page }) => {
    await waitForYearSlider(page);

    const slider = page.locator('[data-testid="year-slider-input"]');
    const sliderBox = await slider.boundingBox();
    expect(sliderBox).not.toBeNull();

    if (sliderBox) {
      // Initial year should be 2025
      let year = await getCurrentYear(page);
      expect(year).toBe(2025);

      // Drag slider to approximately middle (2037-2038 range)
      const startX = sliderBox.x + 10;
      const endX = sliderBox.x + sliderBox.width / 2;
      const y = sliderBox.y + sliderBox.height / 2;

      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(endX, y, { steps: 10 });
      await page.mouse.up();

      // Year should have changed
      year = await getCurrentYear(page);
      expect(year).toBeGreaterThan(2025);
      expect(year).toBeLessThanOrEqual(2050);
    }
  });

  test('clicking next/previous buttons changes year', async ({ page }) => {
    await waitForYearSlider(page);

    // Initial year
    let year = await getCurrentYear(page);
    expect(year).toBe(2025);

    // Click next year button
    await clickNextYear(page);
    year = await getCurrentYear(page);
    expect(year).toBe(2026);

    // Click next year again
    await clickNextYear(page);
    year = await getCurrentYear(page);
    expect(year).toBe(2027);

    // Click previous year button
    await clickPreviousYear(page);
    year = await getCurrentYear(page);
    expect(year).toBe(2026);
  });

  test('play button starts animation', async ({ page }) => {
    await waitForYearSlider(page);

    // Initial year
    const initialYear = await getCurrentYear(page);
    expect(initialYear).toBe(2025);

    // Click play button
    await clickPlayButton(page);

    // Wait for playback to advance (playback interval is 1000ms)
    await page.waitForTimeout(1500);

    // Year should have advanced
    const newYear = await getCurrentYear(page);
    expect(newYear).toBeGreaterThan(initialYear);

    // Click again to pause
    await clickPlayButton(page);

    // Wait and verify year doesn't change
    const yearAfterPause = await getCurrentYear(page);
    await page.waitForTimeout(1500);
    const yearStillPaused = await getCurrentYear(page);
    expect(yearStillPaused).toBe(yearAfterPause);
  });

  test('year syncs to URL', async ({ page }) => {
    await waitForYearSlider(page);

    // Initial URL should not have year parameter (defaults to 2025)
    // or should have year=2025

    // Click next year to change to 2026
    await clickNextYear(page);

    // URL should now contain year=2026
    await expectYearInUrl(page, 2026);

    // Change to a different year
    await clickNextYear(page);
    await expectYearInUrl(page, 2027);
  });

  test('year loads from URL parameter', async ({ page }) => {
    // Navigate with year parameter in URL
    await page.goto('/?year=2035');
    await waitForMapLoad(page);
    await waitForYearSlider(page);

    // Year display should show 2035
    const year = await getCurrentYear(page);
    expect(year).toBe(2035);
  });

  test('previous button is disabled at start year', async ({ page }) => {
    await waitForYearSlider(page);

    // At 2025, previous button should be disabled
    const previousButton = page.locator('[data-testid="previous-year-button"]');
    await expect(previousButton).toBeDisabled();

    // Move to 2026 and previous should be enabled
    await clickNextYear(page);
    await expect(previousButton).toBeEnabled();
  });

  test('next button is disabled at end year', async ({ page }) => {
    // Navigate directly to 2050
    await page.goto('/?year=2050');
    await waitForMapLoad(page);
    await waitForYearSlider(page);

    // At 2050, next button should be disabled
    const nextButton = page.locator('[data-testid="next-year-button"]');
    await expect(nextButton).toBeDisabled();

    // Move to 2049 and next should be enabled
    await clickPreviousYear(page);
    await expect(nextButton).toBeEnabled();
  });

  test('play button is disabled at end year', async ({ page }) => {
    // Navigate directly to 2050
    await page.goto('/?year=2050');
    await waitForMapLoad(page);
    await waitForYearSlider(page);

    // At 2050, play button should be disabled
    const playButton = page.locator('[data-testid="play-button"]');
    await expect(playButton).toBeDisabled();
  });
});
