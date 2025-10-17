import React, { useState, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    IconButton,
    Button,
    TextField,
    Paper,
    Stack,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    PhotoCamera,
    PhotoLibrary,
    LocationOn,
    AccessTime,
    Save,
    Close
} from '@mui/icons-material';
import { camera, fileUtils } from '../utils/camera';
import type { Exposure } from '../types';

interface DetailsScreenProps {
    exposure: Exposure;
    onExposureUpdate: (exposure: Exposure) => void;
    onBack: () => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
    exposure,
    onExposureUpdate,
    onBack
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showCameraDialog, setShowCameraDialog] = useState(false);
    const [editedExposure, setEditedExposure] = useState(exposure);

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const handleSave = () => {
        onExposureUpdate(editedExposure);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedExposure(exposure);
        setIsEditing(false);
    };

    const handleImageChange = async (file: File) => {
        try {
            const imageData = await fileUtils.fileToBase64(file);
            setEditedExposure(prev => ({ ...prev, imageData }));
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing selected image');
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await handleImageChange(file);
        }
        event.target.value = '';
    };

    const startCamera = async () => {
        try {
            if (!camera.isSupported()) {
                alert('Camera not supported on this device');
                return;
            }

            // For simplicity, we'll just open the file picker
            // In a real app, you'd implement a camera capture dialog
            fileInputRef.current?.click();
            setShowCameraDialog(false);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Error accessing camera');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" py={2}>
                <Box display="flex" alignItems="center">
                    <IconButton onClick={onBack} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold">
                        Exposure #{exposure.exposureNumber}
                    </Typography>
                </Box>
                <IconButton onClick={() => setIsEditing(!isEditing)} color="primary">
                    <Edit />
                </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {/* Image */}
                {editedExposure.imageData && (
                    <Paper elevation={3} sx={{ mb: 3, position: 'relative' }}>
                        <img
                            src={editedExposure.imageData}
                            alt={`Exposure ${exposure.exposureNumber}`}
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '300px',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                        {isEditing && (
                            <Box
                                position="absolute"
                                top={8}
                                right={8}
                                display="flex"
                                gap={1}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => setShowCameraDialog(true)}
                                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                >
                                    <PhotoCamera />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                >
                                    <PhotoLibrary />
                                </IconButton>
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Metadata */}
                <Stack spacing={3}>
                    {/* Camera Settings */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Camera Settings
                        </Typography>
                        <Stack spacing={2}>
                            {isEditing ? (
                                <>
                                    <TextField
                                        fullWidth
                                        label="Aperture"
                                        value={editedExposure.aperture}
                                        onChange={(e) => setEditedExposure(prev => ({ ...prev, aperture: e.target.value }))}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Shutter Speed"
                                        value={editedExposure.shutterSpeed}
                                        onChange={(e) => setEditedExposure(prev => ({ ...prev, shutterSpeed: e.target.value }))}
                                    />
                                </>
                            ) : (
                                <Stack direction="row" spacing={1}>
                                    <Chip label={exposure.aperture} />
                                    <Chip label={exposure.shutterSpeed} />
                                </Stack>
                            )}
                        </Stack>
                    </Paper>

                    {/* Additional Info */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Notes
                        </Typography>
                        {isEditing ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={editedExposure.additionalInfo}
                                onChange={(e) => setEditedExposure(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                placeholder="Add notes about this exposure..."
                            />
                        ) : (
                            <Typography variant="body1">
                                {exposure.additionalInfo || 'No notes added'}
                            </Typography>
                        )}
                    </Paper>

                    {/* Location & Time */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Details
                        </Typography>
                        <Stack spacing={2}>
                            <Box display="flex" alignItems="center">
                                <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body1">
                                    {formatDateTime(exposure.capturedAt)}
                                </Typography>
                            </Box>

                            {exposure.location && (
                                <Box display="flex" alignItems="center">
                                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1">
                                        {exposure.location.latitude.toFixed(6)}, {exposure.location.longitude.toFixed(6)}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                </Stack>
            </Box>

            {/* Edit Actions */}
            {isEditing && (
                <Box display="flex" gap={2} py={2}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSave}
                        startIcon={<Save />}
                    >
                        Save
                    </Button>
                </Box>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            {/* Camera Dialog */}
            <Dialog open={showCameraDialog} onClose={() => setShowCameraDialog(false)}>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Change Photo</Typography>
                        <IconButton onClick={() => setShowCameraDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PhotoCamera />}
                            onClick={startCamera}
                        >
                            Take Photo
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PhotoLibrary />}
                            onClick={() => {
                                fileInputRef.current?.click();
                                setShowCameraDialog(false);
                            }}
                        >
                            Choose from Gallery
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Container>
    );
};