import type { FilmRoll, Exposure } from '../types';
import { fileUtils } from './camera';

export interface ExportData {
    filmRoll: FilmRoll;
    exposures: ExposureExportData[];
    exportedAt: string;
    version: string;
}

export interface ExposureExportData {
    id: string;
    filmRollId: string;
    exposureNumber: number;
    aperture: string;
    shutterSpeed: string;
    additionalInfo: string;
    imageName: string; // Reference to the image file
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    capturedAt: string; // ISO string format
}

export const exportUtils = {
    // Convert exposure data to export format
    prepareExportData: (filmRoll: FilmRoll, exposures: Exposure[]): ExportData => {
        const filmExposures = exposures.filter(e => e.filmRollId === filmRoll.id);

        const exportExposures: ExposureExportData[] = filmExposures.map(exposure => ({
            id: exposure.id,
            filmRollId: exposure.filmRollId,
            exposureNumber: exposure.exposureNumber,
            aperture: exposure.aperture,
            shutterSpeed: exposure.shutterSpeed,
            additionalInfo: exposure.additionalInfo,
            imageName: `exposure_${exposure.exposureNumber}_${exposure.id}.jpg`,
            location: exposure.location,
            capturedAt: exposure.capturedAt.toISOString()
        }));

        return {
            filmRoll,
            exposures: exportExposures,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    },

    // Export JSON only with native share functionality
    exportJsonOnly: async (filmRoll: FilmRoll, exposures: Exposure[]): Promise<void> => {
        try {
            const exportData = exportUtils.prepareExportData(filmRoll, exposures);
            const jsonString = JSON.stringify(exportData, null, 2);
            const fileName = `${filmRoll.name.replace(/\s+/g, '_')}_metadata.json`;

            // Check if Web Share API is supported (mobile browsers)
            if (navigator.share && navigator.canShare) {
                const blob = new Blob([jsonString], { type: 'application/json' });
                const file = new File([blob], fileName, { type: 'application/json' });

                const shareData = {
                    title: `Film Roll: ${filmRoll.name}`,
                    text: `Film metadata for ${filmRoll.name} (${exportData.exposures.length} exposures)`,
                    files: [file]
                };

                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    return;
                }
            }

            // Fallback: Regular download for desktop
            fileUtils.downloadData(jsonString, fileName, 'application/json');

        } catch (error) {
            console.error('JSON export error:', error);

            // Final fallback: Download without share
            const exportData = exportUtils.prepareExportData(filmRoll, exposures);
            const jsonString = JSON.stringify(exportData, null, 2);
            const fileName = `${filmRoll.name.replace(/\s+/g, '_')}_metadata.json`;
            fileUtils.downloadData(jsonString, fileName, 'application/json');
        }
    },

    // Create and download a zip-like structure (using multiple files)
    exportToLocal: async (filmRoll: FilmRoll, exposures: Exposure[], folderName: string): Promise<void> => {
        try {
            const exportData = exportUtils.prepareExportData(filmRoll, exposures);
            const filmExposures = exposures.filter(e => e.filmRollId === filmRoll.id);

            // Create metadata JSON file
            const metadataJson = JSON.stringify(exportData, null, 2);
            fileUtils.downloadData(metadataJson, `${folderName}/metadata.json`, 'application/json');

            // Download each image with proper naming
            filmExposures.forEach((exposure, index) => {
                if (exposure.imageData) {
                    const imageName = `exposure_${exposure.exposureNumber}_${exposure.id}.jpg`;

                    // Convert base64 to blob and download
                    fetch(exposure.imageData)
                        .then(res => res.blob())
                        .then(blob => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${folderName}/${imageName}`;
                            document.body.appendChild(a);

                            // Stagger downloads to avoid browser limits
                            setTimeout(() => {
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }, index * 500);
                        });
                }
            });

            // Show success message after a delay
            setTimeout(() => {
                alert(`Export completed! Downloaded ${filmExposures.length + 1} files.\n\nNote: Files are downloaded individually. Create a folder named "${folderName}" and move all downloaded files there.`);
            }, filmExposures.length * 500 + 1000);

        } catch (error) {
            console.error('Export error:', error);
            alert('Error during export. Please try again.');
        }
    },

    // Handle local folder import via file input
    importFromLocal: async (files: FileList): Promise<{ filmRoll: FilmRoll; exposures: Exposure[] } | null> => {
        try {
            let metadataFile: File | null = null;
            const imageFiles: { [key: string]: File } = {};

            // Organize files
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name === 'metadata.json') {
                    metadataFile = file;
                } else if (file.type.startsWith('image/')) {
                    imageFiles[file.name] = file;
                }
            }

            if (!metadataFile) {
                throw new Error('No metadata.json file found');
            }

            // Read metadata
            const metadataText = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read metadata file'));
                reader.readAsText(metadataFile!);
            });

            const exportData: ExportData = JSON.parse(metadataText);

            // Convert exposure data back to internal format
            const exposures: Exposure[] = [];

            for (const exportExposure of exportData.exposures) {
                const imageFile = imageFiles[exportExposure.imageName];
                let imageData: string | undefined;

                if (imageFile) {
                    imageData = await fileUtils.fileToBase64(imageFile);
                }

                exposures.push({
                    id: exportExposure.id,
                    filmRollId: exportExposure.filmRollId,
                    exposureNumber: exportExposure.exposureNumber,
                    aperture: exportExposure.aperture,
                    shutterSpeed: exportExposure.shutterSpeed,
                    additionalInfo: exportExposure.additionalInfo,
                    imageData,
                    location: exportExposure.location,
                    capturedAt: new Date(exportExposure.capturedAt)
                });
            }

            // Convert film roll dates
            const filmRoll: FilmRoll = {
                ...exportData.filmRoll,
                createdAt: new Date(exportData.filmRoll.createdAt)
            };

            return { filmRoll, exposures };

        } catch (error) {
            console.error('Import error:', error);
            alert('Error during import. Please check that you selected the correct files including metadata.json.');
            return null;
        }
    }
};

// Google Drive integration (requires Google Drive API setup)
export const googleDriveUtils = {
    // Initialize Google Drive API (placeholder - would need actual Google API setup)
    isAvailable: (): boolean => {
        // Check if Google Drive API is loaded
        return typeof window !== 'undefined' && !!(window as any).gapi;
    },

    // Export to Google Drive (placeholder implementation)
    exportToGoogleDrive: async (filmRoll: FilmRoll, exposures: Exposure[], folderName: string): Promise<void> => {
        // This would require Google Drive API implementation
        // For now, we'll show an informational message and fall back to local export

        if (!googleDriveUtils.isAvailable()) {
            alert('Google Drive integration not available. Exporting locally instead.\n\nTo enable Google Drive:\n1. Set up Google Drive API credentials\n2. Include the Google APIs JavaScript client');

            // Fall back to local export
            return exportUtils.exportToLocal(filmRoll, exposures, folderName);
        }

        try {
            // Placeholder for actual Google Drive implementation
            // This would involve:
            // 1. Creating a folder in Google Drive
            // 2. Uploading metadata.json
            // 3. Uploading each image file
            // 4. Setting appropriate permissions

            alert('Google Drive export would be implemented here with proper API credentials.');

        } catch (error) {
            console.error('Google Drive export error:', error);
            alert('Error exporting to Google Drive. Please try local export instead.');
        }
    },

    // Import from Google Drive (placeholder implementation)
    importFromGoogleDrive: async (_folderName: string): Promise<{ filmRoll: FilmRoll; exposures: Exposure[] } | null> => {
        if (!googleDriveUtils.isAvailable()) {
            alert('Google Drive integration not available.\n\nTo import from Google Drive:\n1. Download the folder locally\n2. Use the local import option');
            return null;
        }

        try {
            // Placeholder for actual Google Drive implementation
            // This would involve:
            // 1. Searching for the folder by name
            // 2. Listing files in the folder
            // 3. Downloading metadata.json
            // 4. Downloading all image files

            alert('Google Drive import would be implemented here with proper API credentials.');
            return null;

        } catch (error) {
            console.error('Google Drive import error:', error);
            alert('Error importing from Google Drive. Please try local import instead.');
            return null;
        }
    }
};