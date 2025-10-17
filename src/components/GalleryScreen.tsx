import React, { useState, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Chip,
    Stack,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import {
    ArrowBack,
    PhotoCamera,
    LocationOn,
    AccessTime,
    CloudUpload,
    CloudDownload,
    FolderOpen,
    Save,
    Share,
    Close,
    Delete
} from '@mui/icons-material';
import type { Exposure, FilmRoll } from '../types';
import { exportUtils, googleDriveUtils } from '../utils/exportImport';
import { storage } from '../utils/storage';

interface GalleryScreenProps {
    filmRoll: FilmRoll;
    exposures: Exposure[];
    onExposureSelect: (exposure: Exposure) => void;
    onExposureDelete?: (exposureId: string) => void;
    onBack: () => void;
    onDataImported?: (filmRoll: FilmRoll, exposures: Exposure[]) => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({
    filmRoll,
    exposures,
    onExposureSelect,
    onExposureDelete,
    onBack,
    onDataImported
}) => {
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [exportFolderName, setExportFolderName] = useState('');
    const [importFolderName, setImportFolderName] = useState('');
    const [exportMethod, setExportMethod] = useState<'local' | 'googledrive' | 'jsononly'>('local');
    const [importMethod, setImportMethod] = useState<'local' | 'googledrive'>('local');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filmExposures = exposures.filter(exposure => exposure.filmRollId === filmRoll.id);

    const handleExport = async () => {
        if (exportMethod !== 'jsononly' && !exportFolderName.trim()) {
            alert('Please enter a folder name');
            return;
        }

        setIsProcessing(true);
        try {
            if (exportMethod === 'googledrive') {
                await googleDriveUtils.exportToGoogleDrive(filmRoll, filmExposures, exportFolderName);
            } else if (exportMethod === 'jsononly') {
                await exportUtils.exportJsonOnly(filmRoll, filmExposures);
            } else {
                await exportUtils.exportToLocal(filmRoll, filmExposures, exportFolderName);
            }
            setShowExportDialog(false);
            setExportFolderName('');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        setIsProcessing(true);
        try {
            let result: { filmRoll: FilmRoll; exposures: Exposure[] } | null = null;

            if (importMethod === 'googledrive') {
                if (!importFolderName.trim()) {
                    alert('Please enter a folder name');
                    setIsProcessing(false);
                    return;
                }
                result = await googleDriveUtils.importFromGoogleDrive(importFolderName);
            } else {
                // Trigger file input for local import
                fileInputRef.current?.click();
                setIsProcessing(false);
                return;
            }

            if (result && onDataImported) {
                // Save imported data
                storage.saveFilmRoll(result.filmRoll);
                result.exposures.forEach(exposure => storage.saveExposure(exposure));

                onDataImported(result.filmRoll, result.exposures);
                setShowImportDialog(false);
                setImportFolderName('');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        try {
            const result = await exportUtils.importFromLocal(files);
            if (result && onDataImported) {
                // Save imported data
                storage.saveFilmRoll(result.filmRoll);
                result.exposures.forEach(exposure => storage.saveExposure(exposure));

                onDataImported(result.filmRoll, result.exposures);
                setShowImportDialog(false);
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }

        // Clear the input
        event.target.value = '';
    };

    const handleDeleteExposure = (exposureId: string, exposureNumber: number) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete exposure #${exposureNumber}?\n\n` +
            'This action cannot be undone.'
        );

        if (confirmed && onExposureDelete) {
            onExposureDelete(exposureId);
        }
    };

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (filmExposures.length === 0) {
        return (
            <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box display="flex" alignItems="center" py={2}>
                    <IconButton onClick={onBack} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            {filmRoll.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ISO {filmRoll.iso} • {filmRoll.totalExposures} exposures
                        </Typography>
                    </Box>
                </Box>

                {/* Empty State */}
                <Box
                    flex={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <PhotoCamera sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No exposures yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start taking photos to see them here
                        </Typography>
                    </Paper>
                </Box>

                {/* Import Button for Empty State */}
                <Box pb={2}>
                    <Button
                        variant="outlined"
                        startIcon={<CloudDownload />}
                        onClick={() => setShowImportDialog(true)}
                        fullWidth
                        disabled={isProcessing}
                    >
                        Import Data
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box display="flex" alignItems="center" py={2}>
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        {filmRoll.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        ISO {filmRoll.iso} • {filmExposures.length}/{filmRoll.totalExposures} exposures
                    </Typography>
                </Box>
            </Box>

            {/* Import/Export Buttons */}
            <Box display="flex" gap={2} pb={2}>
                <Button
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    onClick={() => setShowImportDialog(true)}
                    fullWidth
                    disabled={isProcessing}
                >
                    Import
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => setShowExportDialog(true)}
                    fullWidth
                    disabled={isProcessing || filmExposures.length === 0}
                >
                    Export
                </Button>
            </Box>

            {/* Exposures Grid */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Stack spacing={2}>
                    {filmExposures.map((exposure) => (
                        <Box key={exposure.id}>
                            <Card
                                onClick={() => onExposureSelect(exposure)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3
                                    },
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                <Box display="flex">
                                    {exposure.imageData && (
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 120, height: 120, objectFit: 'cover' }}
                                            image={exposure.imageData}
                                            alt={`Exposure ${exposure.exposureNumber}`}
                                        />
                                    )}
                                    <CardContent sx={{ flex: 1, p: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Typography variant="h6" fontWeight="bold">
                                                #{exposure.exposureNumber}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                                    <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                                                    {formatDateTime(exposure.capturedAt)}
                                                </Typography>
                                                {onExposureDelete && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExposure(exposure.id, exposure.exposureNumber);
                                                        }}
                                                        sx={{
                                                            color: 'text.secondary',
                                                            '&:hover': { color: 'error.main' }
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>

                                        <Stack direction="row" spacing={1} mb={1}>
                                            <Chip
                                                label={exposure.aperture}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={exposure.shutterSpeed}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Stack>

                                        {exposure.location && (
                                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                                <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                                                {exposure.location.latitude.toFixed(4)}, {exposure.location.longitude.toFixed(4)}
                                            </Typography>
                                        )}

                                        {exposure.additionalInfo && (
                                            <Typography variant="body2" color="text.secondary" mt={1} noWrap>
                                                {exposure.additionalInfo}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Box>
                            </Card>
                        </Box>
                    ))}
                </Stack>
            </Box>

            {/* Hidden file input for local import */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,image/*"
                style={{ display: 'none' }}
                onChange={handleFileImport}
            />

            {/* Export Dialog */}
            <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Export Film Data</Typography>
                        <IconButton onClick={() => setShowExportDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Folder Name"
                            value={exportFolderName}
                            onChange={(e) => setExportFolderName(e.target.value)}
                            placeholder={`${filmRoll.name.replace(/\s+/g, '_')}_export`}
                            helperText={exportMethod === 'jsononly'
                                ? "Not required for JSON-only export"
                                : "This will be the name of the folder containing your photos and metadata"
                            }
                            disabled={exportMethod === 'jsononly'}
                        />

                        <FormControl component="fieldset">
                            <FormLabel component="legend">Export Method</FormLabel>
                            <RadioGroup
                                value={exportMethod}
                                onChange={(e) => setExportMethod(e.target.value as 'local' | 'googledrive' | 'jsononly')}
                            >
                                <FormControlLabel
                                    value="local"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">Local Download</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Download files to your device
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="jsononly"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">JSON Only</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Share metadata only (Telegram, WhatsApp, etc.)
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="googledrive"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">Google Drive</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Save directly to Google Drive (requires setup)
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleExport}
                        variant="contained"
                        disabled={isProcessing || (exportMethod !== 'jsononly' && !exportFolderName.trim())}
                        startIcon={
                            exportMethod === 'googledrive' ? <CloudUpload /> :
                                exportMethod === 'jsononly' ? <Share /> : <Save />
                        }
                    >
                        {isProcessing ? 'Exporting...' :
                            exportMethod === 'jsononly' ? 'Share JSON' : 'Export'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Import Film Data</Typography>
                        <IconButton onClick={() => setShowImportDialog(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Import Method</FormLabel>
                            <RadioGroup
                                value={importMethod}
                                onChange={(e) => setImportMethod(e.target.value as 'local' | 'googledrive')}
                            >
                                <FormControlLabel
                                    value="local"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">Local Files</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Select files from your device
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="googledrive"
                                    control={<Radio />}
                                    label={
                                        <Box>
                                            <Typography variant="body2">Google Drive</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Import from Google Drive folder (requires setup)
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>

                        {importMethod === 'googledrive' && (
                            <TextField
                                fullWidth
                                label="Folder Name"
                                value={importFolderName}
                                onChange={(e) => setImportFolderName(e.target.value)}
                                placeholder="Enter Google Drive folder name"
                                helperText="Name of the folder in Google Drive containing the exported data"
                            />
                        )}

                        {importMethod === 'local' && (
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Click "Import" to select the metadata.json file and all image files from your exported folder.
                                </Typography>
                            </Paper>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleImport}
                        variant="contained"
                        disabled={isProcessing || (importMethod === 'googledrive' && !importFolderName.trim())}
                        startIcon={importMethod === 'googledrive' ? <CloudDownload /> : <FolderOpen />}
                    >
                        {isProcessing ? 'Importing...' : 'Import'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};