export interface Camera {
    id: string;
    make: string;
    model: string;
    lens: string;
    name: string; // Auto-generated: "Make Model, Lens"
    createdAt: Date;
}

export interface FilmRoll {
    id: string;
    name: string;
    iso: number;
    totalExposures: number;
    cameraId?: string;
    createdAt: Date;
}

export interface Exposure {
    id: string;
    filmRollId: string;
    exposureNumber: number;
    aperture: string;
    shutterSpeed: string;
    additionalInfo: string;
    imageData?: string; // Base64 encoded image
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    capturedAt: Date;
}

export interface GoogleDriveSettings {
    enabled: boolean;
    folderId?: string;
    folderUrl?: string;
    clientId?: string;
    apiKey?: string;
    accessToken?: string;
    autoSync: boolean;
    lastSyncTime?: Date;
}

export interface AppSettings {
    googleDrive: GoogleDriveSettings;
    version: string;
}

export interface AppState {
    currentFilmRoll: FilmRoll | null;
    filmRolls: FilmRoll[];
    cameras: Camera[];
    exposures: Exposure[];
    currentScreen: 'filmrolls' | 'setup' | 'camera' | 'gallery' | 'details';
    selectedExposure: Exposure | null;
    settings: AppSettings;
}