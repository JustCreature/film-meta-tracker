import { test as base } from '@playwright/test';
import { FilmTrackerPage } from '../utils/page-objects';

/**
 * Custom test fixtures for Film Photography Tracker
 * Extends Playwright's base test with application-specific fixtures
 */
export const test = base.extend<{
  filmTrackerPage: FilmTrackerPage;
  cleanApp: void;
}>({
  /**
   * Film Tracker Page Object Model fixture
   * Provides a configured page object for easy interaction with the app
   */
  filmTrackerPage: async ({ page }, use) => {
    const filmTrackerPage = new FilmTrackerPage(page);
    await filmTrackerPage.goto();
    await filmTrackerPage.waitForLoadState();
    await use(filmTrackerPage);
  },

  /**
   * Clean app fixture
   * Ensures the app starts with a clean state (cleared localStorage)
   */
  cleanApp: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await use();
  },
});

export { expect } from '@playwright/test';