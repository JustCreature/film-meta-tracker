import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { PhotoCamera, Settings } from '@mui/icons-material';
import type { FilmRoll, Camera } from '../types';

interface SetupScreenProps {
    cameras?: Camera[];
    editingFilmRoll?: FilmRoll | null;
    onFilmRollCreated?: (filmRoll: FilmRoll) => void;
    onFilmRollUpdated?: (filmRoll: FilmRoll) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
    cameras = [],
    editingFilmRoll,
    onFilmRollCreated,
    onFilmRollUpdated
}) => {
    const [filmName, setFilmName] = useState(editingFilmRoll?.name || '');
    const [iso, setIso] = useState(editingFilmRoll?.iso?.toString() || '400');
    const [totalExposures, setTotalExposures] = useState(editingFilmRoll?.totalExposures?.toString() || '36');
    const [selectedCameraId, setSelectedCameraId] = useState(editingFilmRoll?.cameraId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!filmName.trim()) {
            alert('Please enter a film name');
            return;
        }

        if (editingFilmRoll) {
            // Update existing film roll
            const updatedFilmRoll: FilmRoll = {
                ...editingFilmRoll,
                name: filmName.trim(),
                iso: parseInt(iso) || 400,
                totalExposures: parseInt(totalExposures) || 36,
                cameraId: selectedCameraId || undefined
            };
            onFilmRollUpdated?.(updatedFilmRoll);
        } else {
            // Create new film roll
            const filmRoll: FilmRoll = {
                id: Date.now().toString(),
                name: filmName.trim(),
                iso: parseInt(iso) || 400,
                totalExposures: parseInt(totalExposures) || 36,
                cameraId: selectedCameraId || undefined,
                createdAt: new Date()
            };
            onFilmRollCreated?.(filmRoll);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Paper elevation={3} sx={{ width: '100%', p: 4 }}>
                <Box textAlign="center" mb={4}>
                    <PhotoCamera sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                        {editingFilmRoll ? 'Edit Film Roll' : 'Film Tracker'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {editingFilmRoll
                            ? 'Update your film roll parameters'
                            : 'Set up your film parameters to start tracking exposures'
                        }
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Film Name"
                            value={filmName}
                            onChange={(e) => setFilmName(e.target.value)}
                            placeholder="e.g., Kodak Portra 400"
                            required
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="ISO"
                            type="number"
                            value={iso}
                            onChange={(e) => setIso(e.target.value)}
                            inputProps={{ min: 25, max: 6400 }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Number of Exposures"
                            type="number"
                            value={totalExposures}
                            onChange={(e) => setTotalExposures(e.target.value)}
                            inputProps={{ min: 1, max: 100 }}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Camera (Optional)</InputLabel>
                            <Select
                                value={selectedCameraId}
                                label="Camera (Optional)"
                                onChange={(e) => setSelectedCameraId(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>None selected</em>
                                </MenuItem>
                                {cameras.map((camera) => (
                                    <MenuItem key={camera.id} value={camera.id}>
                                        {camera.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<Settings />}
                            sx={{ mt: 3, py: 1.5 }}
                        >
                            {editingFilmRoll ? 'Update Film Roll' : 'Start Film Roll'}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
};