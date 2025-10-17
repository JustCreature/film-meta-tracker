import type { FilmRoll, Exposure, Camera, AppSettings } from '../types';

const STORAGE_KEYS = {
    FILM_ROLLS: 'filmRolls',
    EXPOSURES: 'exposures',
    CURRENT_FILM_ROLL: 'currentFilmRoll',
    CAMERAS: 'cameras',
    SETTINGS: 'appSettings'
};

export const storage = {
    // Film Rolls
    saveFilmRoll: (filmRoll: FilmRoll): void => {
        const existingRolls = storage.getFilmRolls();
        const updatedRolls = [...existingRolls.filter(r => r.id !== filmRoll.id), filmRoll];
        localStorage.setItem(STORAGE_KEYS.FILM_ROLLS, JSON.stringify(updatedRolls));
    },

    getFilmRolls: (): FilmRoll[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.FILM_ROLLS);
        return stored ? JSON.parse(stored).map((roll: any) => ({
            ...roll,
            createdAt: new Date(roll.createdAt)
        })) : [];
    },

    deleteFilmRoll: (filmRollId: string): void => {
        const existingRolls = storage.getFilmRolls();
        const updatedRolls = existingRolls.filter(r => r.id !== filmRollId);
        localStorage.setItem(STORAGE_KEYS.FILM_ROLLS, JSON.stringify(updatedRolls));
    },

    // Current Film Roll
    setCurrentFilmRoll: (filmRoll: FilmRoll | null): void => {
        if (filmRoll) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_FILM_ROLL, JSON.stringify(filmRoll));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_FILM_ROLL);
        }
    },

    getCurrentFilmRoll: (): FilmRoll | null => {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_FILM_ROLL);
        return stored ? {
            ...JSON.parse(stored),
            createdAt: new Date(JSON.parse(stored).createdAt)
        } : null;
    },

    // Cameras
    saveCamera: (camera: Camera): void => {
        const existingCameras = storage.getCameras();
        const updatedCameras = [...existingCameras.filter(c => c.id !== camera.id), camera];
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updatedCameras));
    },

    getCameras: (): Camera[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.CAMERAS);
        return stored ? JSON.parse(stored).map((camera: any) => ({
            ...camera,
            createdAt: new Date(camera.createdAt)
        })) : [];
    },

    deleteCamera: (cameraId: string): void => {
        const existingCameras = storage.getCameras();
        const updatedCameras = existingCameras.filter(c => c.id !== cameraId);
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updatedCameras));
    },

    // Exposures
    saveExposure: (exposure: Exposure): void => {
        const existingExposures = storage.getExposures();
        const updatedExposures = [...existingExposures.filter(e => e.id !== exposure.id), exposure];
        localStorage.setItem(STORAGE_KEYS.EXPOSURES, JSON.stringify(updatedExposures));
    },

    getExposures: (): Exposure[] => {
        const stored = localStorage.getItem(STORAGE_KEYS.EXPOSURES);
        return stored ? JSON.parse(stored).map((exposure: any) => ({
            ...exposure,
            capturedAt: new Date(exposure.capturedAt)
        })) : [];
    },

    getExposuresForFilmRoll: (filmRollId: string): Exposure[] => {
        return storage.getExposures().filter(exposure => exposure.filmRollId === filmRollId);
    },

    deleteExposure: (exposureId: string): void => {
        const existingExposures = storage.getExposures();
        const updatedExposures = existingExposures.filter(e => e.id !== exposureId);
        localStorage.setItem(STORAGE_KEYS.EXPOSURES, JSON.stringify(updatedExposures));
    },

    // Settings
    saveSettings: (settings: AppSettings): void => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    getSettings: (): AppSettings => {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const defaultSettings: AppSettings = {
            googleDrive: {
                enabled: false,
                autoSync: false
            },
            version: '1.0.0'
        };

        if (!stored) {
            return defaultSettings;
        }

        try {
            const parsed = JSON.parse(stored);
            return {
                ...defaultSettings,
                ...parsed,
                googleDrive: {
                    ...defaultSettings.googleDrive,
                    ...parsed.googleDrive,
                    lastSyncTime: parsed.googleDrive?.lastSyncTime ? new Date(parsed.googleDrive.lastSyncTime) : undefined
                }
            };
        } catch {
            return defaultSettings;
        }
    },

    // Clear all data
    clearAll: (): void => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};