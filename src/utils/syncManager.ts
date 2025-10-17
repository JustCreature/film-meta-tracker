import { GoogleDriveService } from './googleDriveService';
import { storage } from './storage';
import type { AppSettings, FilmRoll, Camera, Exposure } from '../types';

export class SyncManager {
    private googleDriveService: GoogleDriveService | null = null;
    private settings: AppSettings;

    constructor(settings: AppSettings) {
        this.settings = settings;
        if (settings.googleDrive.enabled) {
            this.googleDriveService = new GoogleDriveService(settings.googleDrive);
        }
    }

    updateSettings(settings: AppSettings) {
        this.settings = settings;
        if (settings.googleDrive.enabled) {
            if (!this.googleDriveService) {
                this.googleDriveService = new GoogleDriveService(settings.googleDrive);
            } else {
                this.googleDriveService.updateSettings(settings.googleDrive);
            }
        } else {
            this.googleDriveService = null;
        }
    }

    async syncToCloud(): Promise<boolean> {
        if (!this.googleDriveService || !this.settings.googleDrive.enabled) {
            return false;
        }

        try {
            const filmRolls = storage.getFilmRolls();
            const cameras = storage.getCameras();
            const exposures = storage.getExposures();

            const backupData = {
                filmRolls,
                cameras,
                exposures,
                exportedAt: new Date(),
                version: this.settings.version
            };

            await this.googleDriveService.uploadBackup(backupData);

            // Update last sync time
            const updatedSettings = {
                ...this.settings,
                googleDrive: {
                    ...this.settings.googleDrive,
                    lastSyncTime: new Date()
                }
            };

            storage.saveSettings(updatedSettings);
            return true;
        } catch (error) {
            console.error('Failed to sync to cloud:', error);
            return false;
        }
    }

    async syncFromCloud(): Promise<{
        filmRolls: FilmRoll[];
        cameras: Camera[];
        exposures: Exposure[];
    } | null> {
        if (!this.googleDriveService || !this.settings.googleDrive.enabled) {
            return null;
        }

        try {
            const backupData = await this.googleDriveService.downloadLatestBackup();

            if (!backupData) {
                return null;
            }

            return {
                filmRolls: backupData.filmRolls,
                cameras: backupData.cameras,
                exposures: backupData.exposures
            };
        } catch (error) {
            console.error('Failed to sync from cloud:', error);
            return null;
        }
    }

    async performAutoSync(): Promise<{
        success: boolean;
        action: 'upload' | 'download' | 'none';
        message: string;
    }> {
        if (!this.settings.googleDrive.enabled || !this.settings.googleDrive.autoSync) {
            return {
                success: false,
                action: 'none',
                message: 'Auto-sync is disabled'
            };
        }

        try {
            // Check if there's a cloud backup and when it was last updated
            const cloudBackup = await this.syncFromCloud();
            const localLastModified = this.getLocalLastModified();

            if (!cloudBackup) {
                // No cloud backup exists, upload local data
                const success = await this.syncToCloud();
                return {
                    success,
                    action: 'upload',
                    message: success ? 'Local data backed up to cloud' : 'Failed to backup to cloud'
                };
            }

            const cloudLastModified = cloudBackup ? await this.googleDriveService?.getLastSyncTime() : null;

            if (cloudLastModified && localLastModified && cloudLastModified > localLastModified) {
                // Cloud data is newer, merge/update local data
                this.mergeCloudData(cloudBackup);
                return {
                    success: true,
                    action: 'download',
                    message: 'Updated with latest data from cloud'
                };
            } else {
                // Local data is newer or same, upload to cloud
                const success = await this.syncToCloud();
                return {
                    success,
                    action: 'upload',
                    message: success ? 'Local changes backed up to cloud' : 'Failed to backup to cloud'
                };
            }
        } catch (error) {
            return {
                success: false,
                action: 'none',
                message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    private getLocalLastModified(): Date {
        const filmRolls = storage.getFilmRolls();
        const cameras = storage.getCameras();
        const exposures = storage.getExposures();

        const dates = [
            ...filmRolls.map(r => r.createdAt),
            ...cameras.map(c => c.createdAt),
            ...exposures.map(e => e.capturedAt)
        ];

        return dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date(0);
    }

    private mergeCloudData(cloudData: {
        filmRolls: FilmRoll[];
        cameras: Camera[];
        exposures: Exposure[];
    }): void {
        const localFilmRolls = storage.getFilmRolls();
        const localCameras = storage.getCameras();
        const localExposures = storage.getExposures();

        // Simple merge strategy: keep the most recent version of each item
        const mergedFilmRolls = this.mergeByRecency(localFilmRolls, cloudData.filmRolls, 'createdAt');
        const mergedCameras = this.mergeByRecency(localCameras, cloudData.cameras, 'createdAt');
        const mergedExposures = this.mergeByRecency(localExposures, cloudData.exposures, 'capturedAt');

        // Save merged data
        mergedFilmRolls.forEach(roll => storage.saveFilmRoll(roll));
        mergedCameras.forEach(camera => storage.saveCamera(camera));
        mergedExposures.forEach(exposure => storage.saveExposure(exposure));
    }

    private mergeByRecency<T extends { id: string;[key: string]: any }>(
        local: T[],
        cloud: T[],
        dateField: keyof T
    ): T[] {
        const merged = new Map<string, T>();

        // Add all local items
        local.forEach(item => merged.set(item.id, item));

        // Add/update with cloud items if they're newer
        cloud.forEach(cloudItem => {
            const localItem = merged.get(cloudItem.id);
            if (!localItem || new Date(cloudItem[dateField] as any) > new Date(localItem[dateField] as any)) {
                merged.set(cloudItem.id, cloudItem);
            }
        });

        return Array.from(merged.values());
    }
}