/**
 * Test data generators and constants for E2E tests
 * Provides consistent test data across all test files
 */

export const TEST_DATA = {
  filmRolls: {
    basic: {
      name: 'Kodak Portra 400',
      iso: '400',
      exposures: '36'
    },
    highIso: {
      name: 'Ilford HP5 Plus',
      iso: '1600',
      exposures: '24'
    },
    digital: {
      name: 'Test Digital Roll',
      iso: '100',
      exposures: '100'
    }
  },
  cameras: {
    canon: {
      make: 'Canon',
      model: 'EOS R5',
      lens: '50mm f/1.8'
    },
    nikon: {
      make: 'Nikon',
      model: 'D750',
      lens: 'Nikkor 85mm f/1.4'
    },
    vintage: {
      make: 'Zenit',
      model: 'ET',
      lens: 'Helios 44-2 f/2'
    }
  },
  settings: {
    apertures: ['f/1.4', 'f/2.8', 'f/5.6', 'f/8', 'f/11'],
    shutterSpeeds: ['1/1000', '1/500', '1/250', '1/125', '1/60'],
    notes: [
      'Golden hour portrait',
      'Street photography',
      'Landscape shot',
      'Test exposure'
    ]
  }
};

/**
 * Generate random test data
 */
export const generateTestData = {
  filmRoll: () => ({
    name: `Test Film ${Date.now()}`,
    iso: String(Math.floor(Math.random() * 3200) + 100),
    exposures: String(Math.floor(Math.random() * 36) + 12)
  }),

  camera: () => ({
    make: `Make${Date.now()}`,
    model: `Model${Date.now()}`,
    lens: `${Math.floor(Math.random() * 200) + 20}mm f/${(Math.random() * 5 + 1).toFixed(1)}`
  }),

  exposure: () => ({
    aperture: TEST_DATA.settings.apertures[Math.floor(Math.random() * TEST_DATA.settings.apertures.length)],
    shutterSpeed: TEST_DATA.settings.shutterSpeeds[Math.floor(Math.random() * TEST_DATA.settings.shutterSpeeds.length)],
    notes: TEST_DATA.settings.notes[Math.floor(Math.random() * TEST_DATA.settings.notes.length)]
  })
};

/**
 * Validation helpers for test assertions
 */
export const validators = {
  isValidISO: (iso: string): boolean => {
    const isoNum = parseInt(iso);
    return isoNum >= 25 && isoNum <= 6400;
  },

  isValidExposureCount: (count: string): boolean => {
    const countNum = parseInt(count);
    return countNum >= 1 && countNum <= 100;
  },

  isValidCameraName: (make: string, model: string, lens?: string): string => {
    const cameraBody = `${make} ${model}`.trim();
    return lens ? `${cameraBody}, ${lens}` : cameraBody;
  }
};