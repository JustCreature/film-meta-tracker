import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData } from './utils/test-data';

/**
 * Photography Workflow Tests
 * Tests the complete photography workflow: film roll → camera settings → capturing photos
 */
test.describe('Photography Workflow', () => {
    test('should navigate through complete photography workflow', async ({ filmTrackerPage, cleanApp }) => {
        // Create film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Verify we're in camera screen
        await expect(filmTrackerPage.cameraButton).toBeVisible();
        await expect(filmTrackerPage.galleryButton).toBeVisible();

        // Check initial state
        await expect(filmTrackerPage.page.getByText(/1\/36.*left/)).toBeVisible();

        // Access camera settings
        await filmTrackerPage.apertureChip.click();

        // Verify settings dialog opens
        await expect(filmTrackerPage.page.getByRole('dialog')).toBeVisible();
        await expect(filmTrackerPage.page.getByLabel(/aperture/i)).toBeVisible();
        await expect(filmTrackerPage.page.getByLabel(/shutter speed/i)).toBeVisible();
        await expect(filmTrackerPage.page.getByLabel(/additional info/i)).toBeVisible();
    });

    test('should configure camera settings', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Open settings via aperture chip
        await filmTrackerPage.apertureChip.click();

        // Configure settings
        const settings = generateTestData.exposure();
        await filmTrackerPage.page.getByLabel(/aperture/i).fill(settings.aperture);
        await filmTrackerPage.page.getByLabel(/shutter speed/i).fill(settings.shutterSpeed);
        await filmTrackerPage.page.getByLabel(/additional info/i).fill(settings.notes);

        // Close settings
        await filmTrackerPage.page.getByRole('button', { name: /done/i }).click();

        // Verify settings are applied to chips
        await expect(filmTrackerPage.page.getByText(settings.aperture)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(settings.shutterSpeed)).toBeVisible();
    });
});