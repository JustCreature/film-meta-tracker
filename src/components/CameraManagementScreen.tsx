import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Fab,
    AppBar,
    Toolbar,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Alert,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Add,
    CameraAlt,
    Edit,
    Delete,
    MoreVert
} from '@mui/icons-material';
import type { Camera } from '../types';
import { ItemCard } from './ItemCard';


interface CameraManagementScreenProps {
    cameras: Camera[];
    onCameraCreated: (camera: Camera) => void;
    onCameraUpdated: (camera: Camera) => void;
    onCameraDeleted: (cameraId: string) => void;
}

export const CameraManagementScreen: React.FC<CameraManagementScreenProps> = ({
    cameras,
    onCameraCreated,
    onCameraUpdated,
    onCameraDeleted
}) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        lens: ''
    });

    const generateCameraName = (make: string, model: string, lens: string): string => {
        const cameraBody = `${make} ${model}`.trim();
        return lens ? `${cameraBody}, ${lens}` : cameraBody;
    };

    const resetForm = () => {
        setFormData({ make: '', model: '', lens: '' });
        setEditingCamera(null);
    };

    const handleCreateCamera = () => {
        if (!formData.make.trim() || !formData.model.trim()) {
            alert('Please fill in camera make and model');
            return;
        }

        const camera: Camera = {
            id: Date.now().toString(),
            make: formData.make.trim(),
            model: formData.model.trim(),
            lens: formData.lens.trim(),
            name: generateCameraName(formData.make.trim(), formData.model.trim(), formData.lens.trim()),
            createdAt: new Date()
        };

        onCameraCreated(camera);
        setShowCreateDialog(false);
        resetForm();
    };

    const handleUpdateCamera = () => {
        if (!editingCamera || !formData.make.trim() || !formData.model.trim()) {
            alert('Please fill in camera make and model');
            return;
        }

        const updatedCamera: Camera = {
            ...editingCamera,
            make: formData.make.trim(),
            model: formData.model.trim(),
            lens: formData.lens.trim(),
            name: generateCameraName(formData.make.trim(), formData.model.trim(), formData.lens.trim())
        };

        onCameraUpdated(updatedCamera);
        setEditingCamera(null);
        resetForm();
    };

    const handleEditClick = (camera: Camera) => {
        setEditingCamera(camera);
        setFormData({
            make: camera.make,
            model: camera.model,
            lens: camera.lens
        });
        setMenuAnchor(null);
    };

    const handleDeleteClick = (camera: Camera) => {
        const confirmed = window.confirm(
            `Delete camera "${camera.name}"?\n\nThis will not affect existing film rolls using this camera.`
        );
        if (confirmed) {
            onCameraDeleted(camera.id);
        }
        setMenuAnchor(null);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, camera: Camera) => {
        event.stopPropagation();
        setSelectedCamera(camera);
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedCamera(null);
    };

    const sortedCameras = [...cameras].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <CameraAlt sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Camera Equipment
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                        {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {cameras.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="60vh"
                        textAlign="center"
                    >
                        <CameraAlt sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" gutterBottom color="text.secondary">
                            No Cameras Added Yet
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                            Add your camera equipment to automatically include metadata in your film roll exports.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setShowCreateDialog(true)}
                            size="large"
                        >
                            Add Camera
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                Your Camera Equipment
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Manage your cameras and lenses for accurate metadata tracking.
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)'
                                },
                                gap: 3
                            }}
                        >
                            {sortedCameras.map((camera) => (
                                <Box key={camera.id} sx={{ position: 'relative' }}>
                                    <ItemCard
                                        id={camera.id}
                                        title={camera.name}
                                        subtitle={new Date(camera.createdAt).toLocaleDateString()}
                                        metadata={[
                                            { label: 'Make', value: camera.make },
                                            { label: 'Model', value: camera.model },
                                            ...(camera.lens ? [{ label: 'Lens', value: camera.lens }] : [])
                                        ]}
                                    />
                                    <IconButton
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            bgcolor: 'background.paper',
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                        onClick={(e) => handleMenuClick(e, camera)}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </>
                )}
            </Container>

            {/* Add Camera FAB */}
            <Fab
                color="primary"
                aria-label="add camera"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => setShowCreateDialog(true)}
            >
                <Add />
            </Fab>

            {/* Create/Edit Camera Dialog */}
            <Dialog
                open={showCreateDialog || editingCamera !== null}
                onClose={() => {
                    setShowCreateDialog(false);
                    setEditingCamera(null);
                    resetForm();
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingCamera ? 'Edit Camera' : 'Add New Camera'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Camera Make"
                            value={formData.make}
                            onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                            placeholder="e.g., Canon, Nikon, Zenit"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Camera Model"
                            value={formData.model}
                            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                            placeholder="e.g., EOS R5, D750, ET"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Lens"
                            value={formData.lens}
                            onChange={(e) => setFormData(prev => ({ ...prev, lens: e.target.value }))}
                            placeholder="e.g., 50mm f/1.8, Helios 44-2 f/2"
                        />

                        {(formData.make || formData.model || formData.lens) && (
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Camera Name:</strong> {generateCameraName(formData.make, formData.model, formData.lens)}
                                </Typography>
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowCreateDialog(false);
                        setEditingCamera(null);
                        resetForm();
                    }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={editingCamera ? handleUpdateCamera : handleCreateCamera}
                        variant="contained"
                        disabled={!formData.make.trim() || !formData.model.trim()}
                    >
                        {editingCamera ? 'Update' : 'Add'} Camera
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Camera Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => selectedCamera && handleEditClick(selectedCamera)}>
                    <Edit sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => selectedCamera && handleDeleteClick(selectedCamera)}>
                    <Delete sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};