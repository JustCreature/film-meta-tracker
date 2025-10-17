export const camera = {
    // Check if camera access is available
    isSupported: (): boolean => {
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

        console.log('Camera support check:', {
            hasMediaDevices,
            isSecureContext,
            protocol: location.protocol,
            hostname: location.hostname
        });

        return hasMediaDevices && isSecureContext;
    },

    // Check camera permissions
    checkPermissions: async (): Promise<'granted' | 'denied' | 'prompt'> => {
        try {
            if (navigator.permissions) {
                const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
                return result.state;
            }
        } catch (error) {
            console.log('Permission API not supported:', error);
        }
        return 'prompt';
    },

    // Request camera permission and get media stream
    getMediaStream: async (): Promise<MediaStream> => {
        const constraints = [
            // Try rear camera with specific resolution first
            {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try rear camera without exact constraint
            {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try front camera
            {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try any camera with resolution
            {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            // Try most basic constraints
            {
                video: true
            }
        ];

        for (let i = 0; i < constraints.length; i++) {
            try {
                console.log(`Trying camera constraints ${i + 1}/${constraints.length}:`, constraints[i]);
                const stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
                console.log('Camera access successful with constraints:', constraints[i]);
                return stream;
            } catch (error) {
                console.warn(`Camera attempt ${i + 1} failed:`, error);
                if (i === constraints.length - 1) {
                    // Last attempt failed
                    throw new Error(`Camera access failed after ${constraints.length} attempts. Please check permissions and try again.`);
                }
            }
        }

        throw new Error('Unexpected error in camera access');
    },

    // Capture image from video stream with mobile optimizations
    captureImage: (video: HTMLVideoElement): string => {
        const canvas = document.createElement('canvas');

        // Get actual video dimensions
        const videoWidth = video.videoWidth || video.clientWidth;
        const videoHeight = video.videoHeight || video.clientHeight;

        if (videoWidth === 0 || videoHeight === 0) {
            throw new Error('Video not ready - invalid dimensions');
        }

        // Limit canvas size for mobile performance
        const maxSize = 1280;
        let canvasWidth = videoWidth;
        let canvasHeight = videoHeight;

        if (videoWidth > maxSize || videoHeight > maxSize) {
            const aspectRatio = videoWidth / videoHeight;
            if (videoWidth > videoHeight) {
                canvasWidth = maxSize;
                canvasHeight = maxSize / aspectRatio;
            } else {
                canvasHeight = maxSize;
                canvasWidth = maxSize * aspectRatio;
            }
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to create canvas context');
        }

        try {
            // Draw and scale the video frame
            ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

            // Use higher quality for smaller images, lower for larger ones
            const quality = canvasWidth * canvasHeight > 640 * 480 ? 0.7 : 0.8;
            const dataURL = canvas.toDataURL('image/jpeg', quality);

            if (!dataURL || dataURL.length < 100) {
                throw new Error('Failed to generate image data');
            }

            return dataURL;
        } catch (error) {
            console.error('Error drawing to canvas:', error);
            throw new Error('Failed to capture image from video');
        }
    },

    // Stop media stream
    stopStream: (stream: MediaStream): void => {
        stream.getTracks().forEach(track => track.stop());
    }
};

export const geolocation = {
    // Check if geolocation is supported
    isSupported: (): boolean => {
        return !!navigator.geolocation;
    },

    // Get current position
    getCurrentPosition: (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!geolocation.isSupported()) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    reject(new Error('Unable to get location'));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        });
    }
};

export const fileUtils = {
    // Convert file to base64 with mobile-specific handling
    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Validate file first
            if (!file || !(file instanceof File)) {
                reject(new Error('Invalid file provided'));
                return;
            }

            // Check file size (limit to 10MB for mobile compatibility)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                reject(new Error('File too large. Please select a smaller image.'));
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('Please select an image file.'));
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to convert file to base64'));
                    }
                } catch (error) {
                    console.error('FileReader result processing error:', error);
                    reject(new Error('Error processing file'));
                }
            };

            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(new Error('Failed to read file'));
            };

            reader.onabort = () => {
                reject(new Error('File reading was aborted'));
            };

            try {
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error starting file read:', error);
                reject(new Error('Failed to start reading file'));
            }
        });
    },

    // Create and trigger download
    downloadData: (data: string, filename: string, mimeType: string = 'application/json'): void => {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};