import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData, validators } from './utils/test-data';
import { getExposureCounterSelector } from './utils/test-helpers';

/**
 * Film Roll Management Tests
 * Tests creation, editing, deletion, and validation of film rolls
 */
test.describe('Film Roll Management', () => {
    test('should create a basic film roll successfully', async ({ filmTrackerPage, cleanApp }) => {
        const filmData = TEST_DATA.filmRolls.basic;

        // Create film roll
        await filmTrackerPage.createFilmRoll(filmData);

        // Verify we're redirected to camera screen
        await expect(filmTrackerPage.page.getByText(filmData.name)).toBeVisible();
        await expect(filmTrackerPage.cameraButton).toBeVisible();
        await expect(filmTrackerPage.galleryButton).toBeVisible();

        // Verify exposure counter shows progress
        await expect(filmTrackerPage.page.getByText(/1.*36/)).toBeVisible();
    });

    test('should validate film roll form inputs', async ({ filmTrackerPage, cleanApp }) => {
        // Open film roll creation
        await filmTrackerPage.createFilmRollButton.click();

        // Try to submit without film name
        await filmTrackerPage.startFilmRollButton.click();

        // Should show validation error (form should not submit)
        await expect(filmTrackerPage.filmNameInput).toBeVisible();

        // Fill invalid ISO
        await filmTrackerPage.filmNameInput.fill('Test Film');
        await filmTrackerPage.isoInput.fill('999999');

        // Fill invalid exposure count
        await filmTrackerPage.exposuresInput.fill('0');

        await filmTrackerPage.startFilmRollButton.click();

        // Verify form validates input constraints
        await expect(filmTrackerPage.filmNameInput).toBeVisible(); // Still on form
    });

    test('should navigate to camera screen from film roll', async ({ filmTrackerPage, cleanApp }) => {
        // Create a film roll
        await filmTrackerPage.createFilmRoll(TEST_DATA.filmRolls.basic);

        // Verify we're in camera screen
        await expect(filmTrackerPage.cameraButton).toBeVisible();
        await expect(filmTrackerPage.galleryButton).toBeVisible();

        // Verify film roll info is displayed
        await expect(filmTrackerPage.page.getByText(TEST_DATA.filmRolls.basic.name)).toBeVisible();
        await expect(filmTrackerPage.page.getByText(/1\/36/)).toBeVisible();
    });

    test('should handle special characters in film names', async ({ filmTrackerPage, cleanApp }) => {
        const specialFilm = {
            name: 'Tëst Fïlm with Spêcial Characters & Numbers 123!',
            iso: '800',
            exposures: '24'
        };

        await filmTrackerPage.createFilmRoll(specialFilm);
        await expect(filmTrackerPage.page.getByText(specialFilm.name)).toBeVisible();
    });
});