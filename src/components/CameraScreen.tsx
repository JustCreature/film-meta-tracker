import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Stack,
    Chip,
    Fab
} from '@mui/material';
import {
    PhotoCamera,
    PhotoLibrary,
    CameraAlt,
    Close,
    ArrowBack
} from '@mui/icons-material';
import { camera, geolocation, fileUtils } from '../utils/camera';
import type { FilmRoll, Exposure } from '../types';

interface CameraScreenProps {
    filmRoll: FilmRoll;
    exposures: Exposure[];
    onExposureTaken: (exposure: Exposure) => void;
    onOpenGallery: () => void;
    onBack?: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
    filmRoll,
    exposures,
    onExposureTaken,
    onOpenGallery,
    onBack
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [currentSettings, setCurrentSettings] = useState({
        aperture: 'f/8',
        shutterSpeed: '1/125',
        additionalInfo: ''
    });

    const currentExposureNumber = exposures.filter(e => e.filmRollId === filmRoll.id).length + 1;
    const exposuresLeft = filmRoll.totalExposures - (currentExposureNumber - 1);

    useEffect(() => {
        if (isCameraActive) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isCameraActive]);

    const startCamera = async () => {
        try {
            console.log('Starting camera initialization...');

            // Check basic support
            if (!camera.isSupported()) {
                const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';
                const supportMsg = !isHttps
                    ? 'Camera requires HTTPS connection. Try accessing the app via HTTPS or localhost.'
                    : 'Camera not supported on this device or browser.';
                alert(supportMsg);
                setIsCameraActive(false);
                return;
            }

            // Check permissions first
            const permissionState = await camera.checkPermissions();
            console.log('Camera permission state:', permissionState);

            if (permissionState === 'denied') {
                alert('Camera access denied. Please:\n1. Go to browser settings\n2. Allow camera for this site\n3. Refresh the page');
                setIsCameraActive(false);
                return;
            }

            console.log('Requesting camera access...');
            const stream = await camera.getMediaStream();
            console.log('Camera stream obtained:', stream);

            if (videoRef.current && stream) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Wait for video to be ready on mobile
                videoRef.current.onloadedmetadata = () => {
                    console.log('Camera ready, video dimensions:',
                        videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                };

                // Handle mobile-specific video events
                videoRef.current.oncanplay = () => {
                    console.log('Video can play');
                };

                videoRef.current.onerror = (err) => {
                    console.error('Video element error:', err);
                };

                // Autoplay might be blocked on some mobile browsers
                try {
                    await videoRef.current.play();
                    console.log('Video playback started');
                } catch (playError) {
                    console.warn('Autoplay blocked, user interaction required:', playError);
                }
            } else {
                throw new Error('Failed to set up video element or stream');
            }
        } catch (error) {
            console.error('Error starting camera:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';

            // More specific error handling
            let userMessage = `Camera Error: ${errorMessage}\n\n`;

            if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
                userMessage += 'Please allow camera access and try again.';
            } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
                userMessage += 'No camera found on this device.';
            } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
                userMessage += 'Camera is being used by another app. Please close other apps and try again.';
            } else {
                userMessage += 'Please check:\n1. Camera permissions\n2. Camera is not in use by other apps\n3. Browser supports camera access';
            }

            alert(userMessage);
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            camera.stopStream(streamRef.current);
            streamRef.current = null;
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !streamRef.current) {
            alert('Camera not ready. Please start the camera first.');
            return;
        }

        try {
            // Check if video is actually playing
            if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                alert('Camera not ready. Please wait for camera to initialize.');
                return;
            }

            const imageData = camera.captureImage(videoRef.current);

            // Validate captured image
            if (!imageData || imageData.length < 100) {
                throw new Error('Failed to capture image data');
            }

            const location = geolocation.isSupported()
                ? await geolocation.getCurrentPosition().catch((err) => {
                    console.warn('Location not available:', err);
                    return undefined;
                })
                : undefined;

            const exposure: Exposure = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
                filmRollId: filmRoll.id,
                exposureNumber: currentExposureNumber,
                aperture: currentSettings.aperture,
                shutterSpeed: currentSettings.shutterSpeed,
                additionalInfo: currentSettings.additionalInfo,
                imageData,
                location,
                capturedAt: new Date()
            };

            onExposureTaken(exposure);

            // Reset additional info for next shot
            setCurrentSettings(prev => ({ ...prev, additionalInfo: '' }));

        } catch (error) {
            console.error('Error capturing photo:', error);
            alert(`Error capturing photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        // Clear the input immediately to allow reselection of the same file
        const target = event.target;
        setTimeout(() => {
            target.value = '';
        }, 100);

        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

        try {
            // Validate file before processing
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('Image too large. Please select a smaller image.');
                return;
            }

            const imageData = await fileUtils.fileToBase64(file);

            if (!imageData || imageData.length < 100) {
                throw new Error('Invalid image data generated');
            }

            console.log('Image processed successfully, size:', imageData.length);

            const location = geolocation.isSupported()
                ? await geolocation.getCurrentPosition().catch((err) => {
                    console.warn('Location not available:', err);
                    return undefined;
                })
                : undefined;

            const exposure: Exposure = {
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
                filmRollId: filmRoll.id,
                exposureNumber: currentExposureNumber,
                aperture: currentSettings.aperture,
                shutterSpeed: currentSettings.shutterSpeed,
                additionalInfo: currentSettings.additionalInfo,
                imageData,
                location,
                capturedAt: new Date()
            };

            console.log('Creating exposure:', exposure.id);
            onExposureTaken(exposure);

            // Reset additional info for next shot
            setCurrentSettings(prev => ({ ...prev, additionalInfo: '' }));

        } catch (error) {
            console.error('Error processing file:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error processing selected image: ${errorMessage}`);
        }
    };

    const openSettingsDialog = () => {
        setShowSettingsDialog(true);
    };

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', py: 2, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    {onBack && (
                        <IconButton onClick={onBack} color="primary">
                            <ArrowBack />
                        </IconButton>
                    )}
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {filmRoll.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentExposureNumber}/{filmRoll.totalExposures} - {exposuresLeft} left
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onOpenGallery} color="primary">
                    <PhotoLibrary />
                </IconButton>
            </Box>

            {/* Camera View */}
            <Paper elevation={3} sx={{ flex: 1, position: 'relative', overflow: 'hidden', mb: 2 }}>
                {isCameraActive ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        bgcolor="grey.100"
                    >
                        <Stack alignItems="center" spacing={2}>
                            <CameraAlt sx={{ fontSize: 64, color: 'grey.400' }} />
                            <Typography variant="body1" color="text.secondary" textAlign="center">
                                Camera not active
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => setIsCameraActive(true)}
                                startIcon={<CameraAlt />}
                            >
                                Enable Camera
                            </Button>
                            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                                You may need to allow camera permissions when prompted
                            </Typography>
                            <Button
                                size="small"
                                onClick={async () => {
                                    const supported = camera.isSupported();
                                    const permission = await camera.checkPermissions();
                                    const info = `
Support: ${supported}
Permission: ${permission}
Protocol: ${location.protocol}
Host: ${location.hostname}
Navigator: ${!!navigator.mediaDevices}
getUserMedia: ${!!navigator.mediaDevices?.getUserMedia}
                                    `.trim();
                                    alert(info);
                                }}
                            >
                                Debug Info
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Settings Chips */}
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={1}>
                <Chip
                    label={`${currentSettings.aperture}`}
                    onClick={openSettingsDialog}
                    variant="outlined"
                    size="small"
                />
                <Chip
                    label={`${currentSettings.shutterSpeed}`}
                    onClick={openSettingsDialog}
                    variant="outlined"
                    size="small"
                />
                <Chip
                    label="Info"
                    onClick={openSettingsDialog}
                    variant="outlined"
                    size="small"
                    color={currentSettings.additionalInfo ? "primary" : "default"}
                />
            </Stack>

            {/* Controls */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<PhotoLibrary />}
                >
                    Gallery
                </Button>

                <Fab
                    color="primary"
                    size="large"
                    onClick={isCameraActive ? capturePhoto : () => setIsCameraActive(true)}
                    disabled={exposuresLeft <= 0}
                    sx={{
                        fontSize: '1.5rem',
                        '&:disabled': {
                            backgroundColor: 'grey.300'
                        }
                    }}
                >
                    <PhotoCamera />
                </Fab>

                <Button
                    variant="outlined"
                    onClick={() => setIsCameraActive(!isCameraActive)}
                >
                    {isCameraActive ? 'Stop' : 'Camera'}
                </Button>
            </Stack>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Settings Dialog */}
            <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Exposure Settings</Typography>
                        <IconButton onClick={() => setShowSettingsDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Aperture"
                            value={currentSettings.aperture}
                            onChange={(e) => setCurrentSettings(prev => ({ ...prev, aperture: e.target.value }))}
                            placeholder="f/8"
                        />
                        <TextField
                            fullWidth
                            label="Shutter Speed"
                            value={currentSettings.shutterSpeed}
                            onChange={(e) => setCurrentSettings(prev => ({ ...prev, shutterSpeed: e.target.value }))}
                            placeholder="1/125"
                        />
                        <TextField
                            fullWidth
                            label="Additional Info"
                            value={currentSettings.additionalInfo}
                            onChange={(e) => setCurrentSettings(prev => ({ ...prev, additionalInfo: e.target.value }))}
                            placeholder="Notes about this shot..."
                            multiline
                            rows={3}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettingsDialog(false)} variant="contained">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};