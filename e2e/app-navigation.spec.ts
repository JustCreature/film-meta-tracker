import { test, expect } from './fixtures/test-fixtures';

/**
 * Basic Application Flow Tests
 * Tests core navigation and initial app state
 */
test.describe('Basic Application Flow', () => {
  test('should load the application successfully', async ({ filmTrackerPage, cleanApp }) => {
    // Verify app loads with main tabs visible
    await expect(filmTrackerPage.filmRollsTab).toBeVisible();
    await expect(filmTrackerPage.camerasTab).toBeVisible();
    
    // Verify initial state shows Film Rolls tab as active
    await expect(filmTrackerPage.filmRollsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate between Film Rolls and Cameras tabs', async ({ filmTrackerPage, cleanApp }) => {
    // Start on Film Rolls tab
    await expect(filmTrackerPage.filmRollsTab).toHaveAttribute('aria-selected', 'true');
    
    // Switch to Cameras tab
    await filmTrackerPage.camerasTab.click();
    await expect(filmTrackerPage.camerasTab).toHaveAttribute('aria-selected', 'true');
    await expect(filmTrackerPage.filmRollsTab).toHaveAttribute('aria-selected', 'false');
    
    // Switch back to Film Rolls tab
    await filmTrackerPage.filmRollsTab.click();
    await expect(filmTrackerPage.filmRollsTab).toHaveAttribute('aria-selected', 'true');
    await expect(filmTrackerPage.camerasTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should show empty state for new users', async ({ filmTrackerPage, cleanApp }) => {
    // Film Rolls tab should show empty state
    await expect(filmTrackerPage.page.getByText(/no film rolls yet/i)).toBeVisible();
    await expect(filmTrackerPage.createFilmRollButton).toBeVisible();
    
    // Cameras tab should show empty state
    await filmTrackerPage.camerasTab.click();
    await expect(filmTrackerPage.page.getByText(/no cameras added/i)).toBeVisible();
    await expect(filmTrackerPage.addCameraButton).toBeVisible();
  });

  test('should open and close settings dialog', async ({ filmTrackerPage, cleanApp }) => {
    // Open settings
    await filmTrackerPage.settingsButton.click();
    await expect(filmTrackerPage.settingsDialog).toBeVisible();
    
    // Verify settings content is visible
    await expect(filmTrackerPage.settingsDialog).toBeVisible();
    
    // Close settings (try multiple methods)
    // Try clicking outside the dialog first
    await filmTrackerPage.page.keyboard.press('Escape');
    await expect(filmTrackerPage.settingsDialog).not.toBeVisible();
  });

  test('should persist data after page reload', async ({ filmTrackerPage, cleanApp }) => {
    // This test will be implemented after we have data creation tests
    // For now, just verify the app loads consistently
    await filmTrackerPage.page.reload();
    await filmTrackerPage.waitForLoadState();
    
    await expect(filmTrackerPage.filmRollsTab).toBeVisible();
    await expect(filmTrackerPage.camerasTab).toBeVisible();
  });

  test('should handle responsive design on mobile viewport', async ({ filmTrackerPage, cleanApp }) => {
    // Test mobile viewport
    await filmTrackerPage.page.setViewportSize({ width: 375, height: 667 });
    
    // Verify main elements are still visible and functional
    await expect(filmTrackerPage.filmRollsTab).toBeVisible();
    await expect(filmTrackerPage.camerasTab).toBeVisible();
    await expect(filmTrackerPage.settingsButton).toBeVisible();
    
    // Test tab switching on mobile
    await filmTrackerPage.camerasTab.click();
    await expect(filmTrackerPage.camerasTab).toHaveAttribute('aria-selected', 'true');
    
    // Reset viewport
    await filmTrackerPage.page.setViewportSize({ width: 1280, height: 720 });
  });
});