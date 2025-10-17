import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Alert,
    Divider,
    Chip,
    Stack,
    IconButton
} from '@mui/material';
import {
    CloudSync,
    CheckCircle,
    Error,
    Warning,
    Close
} from '@mui/icons-material';
import type { AppSettings } from '../types';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
    onManualSync?: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    open,
    onClose,
    settings,
    onSettingsChange,
    onManualSync
}) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleGoogleDriveChange = (field: keyof AppSettings['googleDrive'], value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            googleDrive: {
                ...prev.googleDrive,
                [field]: value
            }
        }));
        setConnectionStatus('idle');
    };

    const extractFolderIdFromUrl = (url: string): string | null => {
        // Extract folder ID from Google Drive folder URL
        // Format: https://drive.google.com/drive/folders/FOLDER_ID
        const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    };

    const testGoogleDriveConnection = async () => {
        const { folderUrl, clientId, apiKey } = localSettings.googleDrive;

        if (!folderUrl || !clientId || !apiKey) {
            setErrorMessage('Please provide folder URL, Client ID, and API Key');
            setConnectionStatus('error');
            return;
        }

        const folderId = extractFolderIdFromUrl(folderUrl);
        if (!folderId) {
            setErrorMessage('Invalid Google Drive folder URL format');
            setConnectionStatus('error');
            return;
        }

        setTestingConnection(true);
        setConnectionStatus('idle');

        try {
            // Import GoogleDriveService dynamically to test connection
            const { GoogleDriveService } = await import('../utils/googleDriveService');

            const testSettings = {
                ...localSettings.googleDrive,
                folderId,
                enabled: true
            };

            const driveService = new GoogleDriveService(testSettings);

            // Test authentication
            await driveService.initializeAuth();
            await driveService.authenticate();

            // If we reach here, authentication was successful
            setConnectionStatus('success');
            setErrorMessage('');

            // Update settings with extracted folder ID
            setLocalSettings(prev => ({
                ...prev,
                googleDrive: {
                    ...prev.googleDrive,
                    folderId: folderId
                }
            }));
        } catch (error: any) {
            setErrorMessage(`Connection failed: ${error?.message || 'Network error'}`);
            setConnectionStatus('error');
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSave = () => {
        onSettingsChange(localSettings);
        onClose();
    };

    const handleManualSync = async () => {
        if (!onManualSync) return;

        setSyncing(true);
        try {
            await onManualSync();
            // Show success message or update UI as needed
        } catch (error) {
            console.error('Manual sync failed:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleCancel = () => {
        setLocalSettings(settings);
        setConnectionStatus('idle');
        setErrorMessage('');
        onClose();
    };

    const getConnectionStatusChip = () => {
        switch (connectionStatus) {
            case 'success':
                return (
                    <Chip
                        icon={<CheckCircle />}
                        label="Connected"
                        color="success"
                        size="small"
                    />
                );
            case 'error':
                return (
                    <Chip
                        icon={<Error />}
                        label="Connection Failed"
                        color="error"
                        size="small"
                    />
                );
            default:
                return (
                    <Chip
                        icon={<Warning />}
                        label="Not Tested"
                        color="default"
                        size="small"
                    />
                );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { m: 2 }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <CloudSync />
                        <Typography variant="h6">Settings</Typography>
                    </Box>
                    <IconButton onClick={handleCancel} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Google Drive Backup Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Google Drive Backup
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Automatically backup your film photography data to Google Drive
                        </Typography>

                        <Stack spacing={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={localSettings.googleDrive.enabled}
                                        onChange={(e) => handleGoogleDriveChange('enabled', e.target.checked)}
                                    />
                                }
                                label="Enable Google Drive Backup"
                            />

                            {localSettings.googleDrive.enabled && (
                                <>
                                    <TextField
                                        label="Google Drive Folder URL"
                                        placeholder="https://drive.google.com/drive/folders/your-folder-id"
                                        value={localSettings.googleDrive.folderUrl || ''}
                                        onChange={(e) => handleGoogleDriveChange('folderUrl', e.target.value)}
                                        fullWidth
                                        helperText="Share a Google Drive folder with edit access and paste the URL here"
                                    />

                                    <TextField
                                        label="Google OAuth Client ID"
                                        placeholder="Your Google OAuth Client ID"
                                        value={localSettings.googleDrive.clientId || ''}
                                        onChange={(e) => handleGoogleDriveChange('clientId', e.target.value)}
                                        fullWidth
                                        helperText={
                                            <Box component="span">
                                                Create an OAuth 2.0 Client ID from the{' '}
                                                <a
                                                    href="https://console.developers.google.com/apis/credentials"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Google Cloud Console
                                                </a>
                                            </Box>
                                        }
                                    />

                                    <TextField
                                        label="Google Drive API Key"
                                        placeholder="Your Google Drive API Key"
                                        value={localSettings.googleDrive.apiKey || ''}
                                        onChange={(e) => handleGoogleDriveChange('apiKey', e.target.value)}
                                        fullWidth
                                        type="password"
                                        helperText={
                                            <Box component="span">
                                                Create an API Key from the{' '}
                                                <a
                                                    href="https://console.developers.google.com/apis/credentials"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Google Cloud Console
                                                </a>
                                            </Box>
                                        }
                                    />

                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Button
                                            variant="outlined"
                                            onClick={testGoogleDriveConnection}
                                            disabled={testingConnection || !localSettings.googleDrive.folderUrl || !localSettings.googleDrive.clientId || !localSettings.googleDrive.apiKey}
                                            startIcon={<CloudSync />}
                                        >
                                            {testingConnection ? 'Testing...' : 'Test Connection'}
                                        </Button>
                                        {connectionStatus === 'success' && onManualSync && (
                                            <Button
                                                variant="contained"
                                                onClick={handleManualSync}
                                                disabled={syncing}
                                                startIcon={<CloudSync />}
                                            >
                                                {syncing ? 'Syncing...' : 'Sync Now'}
                                            </Button>
                                        )}
                                        {getConnectionStatusChip()}
                                    </Box>

                                    {connectionStatus === 'success' && (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={localSettings.googleDrive.autoSync}
                                                    onChange={(e) => handleGoogleDriveChange('autoSync', e.target.checked)}
                                                />
                                            }
                                            label="Auto-sync on app startup and data changes"
                                        />
                                    )}

                                    {errorMessage && (
                                        <Alert severity="error" sx={{ mt: 1 }}>
                                            {errorMessage}
                                        </Alert>
                                    )}

                                    {connectionStatus === 'success' && (
                                        <Alert severity="success" sx={{ mt: 1 }}>
                                            Successfully connected to Google Drive! Your data will be backed up to the specified folder.
                                        </Alert>
                                    )}
                                </>
                            )}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Setup Instructions */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Setup Instructions
                        </Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Step 1:</strong> Create a folder in Google Drive for your backup
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Step 2:</strong> Share the folder with "Anyone with the link can edit"
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Step 3:</strong> Get a Google Drive API key from Google Cloud Console
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Step 4:</strong> Enable the Google Drive API for your project
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Step 5:</strong> Test the connection and enable auto-sync
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={localSettings.googleDrive.enabled && connectionStatus !== 'success'}
                >
                    Save Settings
                </Button>
            </DialogActions>
        </Dialog>
    );
};