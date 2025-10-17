import { test, expect } from './fixtures/test-fixtures';
import { TEST_DATA, generateTestData, validators } from './utils/test-data';

/**
 * Camera Management Tests
 * Tests creation, editing, deletion, and validation of cameras
 */
test.describe('Camera Management', () => {

    test('should create camera without lens', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.camerasTab.click();

        const cameraData = {
            make: 'Nikon',
            model: 'D750'
        };

        await filmTrackerPage.createCamera(cameraData);

        const expectedName = validators.isValidCameraName(cameraData.make, cameraData.model);
        await expect(filmTrackerPage.page.getByText(expectedName)).toBeVisible();
    });

    test('should handle special characters in camera data', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.camerasTab.click();

        const specialCamera = {
            make: 'Mamiya',
            model: 'RZ67 Pro II',
            lens: 'Sekor-Z 110mm f/2.8 W'
        };

        await filmTrackerPage.createCamera(specialCamera);

        const expectedName = validators.isValidCameraName(
            specialCamera.make,
            specialCamera.model,
            specialCamera.lens
        );
        await expect(filmTrackerPage.page.getByText(expectedName)).toBeVisible();
    });

    test('should handle camera creation with generated data', async ({ filmTrackerPage, cleanApp }) => {
        await filmTrackerPage.camerasTab.click();

        // Generate random camera data
        const randomCamera = generateTestData.camera();

        await filmTrackerPage.createCamera(randomCamera);

        const expectedName = validators.isValidCameraName(
            randomCamera.make,
            randomCamera.model,
            randomCamera.lens
        );
        await expect(filmTrackerPage.page.getByText(expectedName)).toBeVisible();
    });
});