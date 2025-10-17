import type { AppSettings, FilmRoll, Camera, Exposure } from '../types';

interface GoogleDriveFile {
    id?: string;
    name: string;
    parents?: string[];
    mimeType?: string;
}

interface BackupData {
    filmRolls: FilmRoll[];
    cameras: Camera[];
    exposures: Exposure[];
    exportedAt: Date;
    version: string;
}

export class GoogleDriveService {
    private settings: AppSettings['googleDrive'];
    private accessToken: string | null = null;
    private tokenClient: any = null;

    constructor(settings: AppSettings['googleDrive']) {
        this.settings = settings;
        this.accessToken = settings.accessToken || null;
    }

    updateSettings(settings: AppSettings['googleDrive']) {
        this.settings = settings;
        this.accessToken = settings.accessToken || null;
    }

    private getApiUrl(path: string): string {
        return `https://www.googleapis.com/drive/v3${path}`;
    }

    private async getHeaders(): Promise<HeadersInit> {
        if (!this.accessToken) {
            // Try to authenticate if no token is available
            await this.authenticate();
        }
        if (!this.accessToken) {
            throw new Error('No access token available. Please authenticate first.');
        }
        return {
            'Authorization': `Bearer ${this.accessToken}`,
        };
    }

    async initializeAuth(): Promise<boolean> {
        if (!this.settings.clientId || !this.settings.apiKey) {
            throw new Error('Both Client ID and API Key are required');
        }

        try {
            // Load the Google APIs client library
            await this.loadGoogleAPIs();

            // Initialize the GAPI client
            await this.initializeGapiClient();

            // Load Google Identity Services
            await this.loadGoogleIdentityServices();

            // Initialize the token client
            this.initializeTokenClient();

            return true;
        } catch (error) {
            console.error('Failed to initialize Google Auth:', error);
            throw error;
        }
    }

    private loadGoogleAPIs(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined' && (window as any).gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                (window as any).gapi.load('client', resolve);
            };
            script.onerror = () => reject(new Error('Failed to load Google APIs'));
            document.head.appendChild(script);
        });
    }

    private async initializeGapiClient(): Promise<void> {
        await (window as any).gapi.client.init({
            apiKey: this.settings.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
    }

    private loadGoogleIdentityServices(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined' && (window as any).google?.accounts) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
            document.head.appendChild(script);
        });
    }

    private initializeTokenClient(): void {
        if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
            this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: this.settings.clientId,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (tokenResponse: any) => {
                    if (tokenResponse.error !== undefined) {
                        throw new Error(tokenResponse.error);
                    }
                    this.accessToken = tokenResponse.access_token;
                },
            });
        }
    }

    private isStandaloneMode(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    }

    async authenticate(): Promise<string> {
        if (!this.settings.clientId || !this.settings.apiKey) {
            throw new Error('Both Client ID and API Key are required');
        }

        try {
            await this.initializeAuth();

            // Check if we're in PWA standalone mode
            if (this.isStandaloneMode()) {
                return this.authenticateInStandaloneMode();
            } else {
                return this.authenticateWithPopup();
            }
        } catch (error) {
            throw new Error(`Authentication failed: ${error}`);
        }
    }

    private authenticateWithPopup(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Token client not initialized'));
                return;
            }

            // Set up callback for token response
            this.tokenClient.callback = (tokenResponse: any) => {
                if (tokenResponse.error !== undefined) {
                    reject(new Error(tokenResponse.error));
                    return;
                }
                this.accessToken = tokenResponse.access_token;
                resolve(this.accessToken!);
            };

            try {
                // Request access token - always prompt for consent for testing
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                // If popup fails, fallback to redirect mode
                console.warn('Popup authentication failed, falling back to redirect mode:', error);
                this.authenticateInStandaloneMode().then(resolve).catch(reject);
            }
        });
    }

    private authenticateInStandaloneMode(): Promise<string> {
        return new Promise((resolve, reject) => {
            // Store the current resolve/reject functions for the redirect callback
            (window as any).googleAuthCallback = (tokenResponse: any) => {
                if (tokenResponse.error !== undefined) {
                    reject(new Error(tokenResponse.error));
                    return;
                }
                this.accessToken = tokenResponse.access_token;
                resolve(this.accessToken!);
            };

            // Build OAuth URL for full window redirect
            // Use the exact redirect URI that should be configured in Google Cloud Console
            const redirectUri = window.location.origin + '/';
            const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
            const state = Math.random().toString(36).substring(2, 15);

            // Store state for validation
            sessionStorage.setItem('oauth_state', state);

            console.log('OAuth redirect URI being used:', redirectUri);
            console.log('Make sure this EXACT URI is configured in Google Cloud Console:');
            console.log('→', redirectUri);

            // Show popup with redirect URI info for mobile debugging
            const showDebugInfo = confirm(
                `OAuth Debug Info:\n\n` +
                `Redirect URI: ${redirectUri}\n\n` +
                `Make sure this EXACT URI is configured in your Google Cloud Console under "Authorized redirect URIs".\n\n` +
                `Click OK to continue with OAuth, or Cancel to abort.`
            );

            if (!showDebugInfo) {
                reject(new Error('OAuth cancelled by user'));
                return;
            }

            // Check if we're returning from OAuth redirect
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const storedState = sessionStorage.getItem('oauth_state');
                const returnedState = params.get('state');

                if (accessToken && returnedState === storedState) {
                    // We're returning from OAuth, resolve immediately
                    this.accessToken = accessToken;
                    window.location.hash = '';
                    sessionStorage.removeItem('oauth_state');
                    resolve(accessToken);
                    return;
                }
            }

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(this.settings.clientId!)}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${scope}&` +
                `response_type=token&` +
                `state=${state}&` +
                `prompt=consent&` +
                `include_granted_scopes=true`;

            console.log('Redirecting to OAuth URL:', authUrl);

            // Redirect the entire window to OAuth
            window.location.href = authUrl;
        });
    }

    async uploadBackup(data: BackupData): Promise<boolean> {
        if (!this.settings.enabled || !this.settings.folderId || !this.settings.clientId || !this.settings.apiKey) {
            throw new Error('Google Drive not properly configured');
        }

        try {
            console.log('Starting backup upload to Google Drive...');
            const fileName = `film-photography-backup-${new Date().toISOString().split('T')[0]}.json`;
            const jsonData = JSON.stringify(data, null, 2);

            console.log('Checking for existing backup file:', fileName);
            // Check if backup file already exists today
            const existingFile = await this.findBackupFile(fileName);

            if (existingFile) {
                console.log('Updating existing file:', existingFile.id);
                // Update existing file
                await this.updateFile(existingFile.id!, jsonData);
            } else {
                console.log('Creating new backup file');
                // Create new file
                await this.createFile(fileName, jsonData);
            }

            console.log('Backup upload completed successfully!');
            return true;
        } catch (error) {
            console.error('Failed to upload backup:', error);
            throw error;
        }
    }

    async downloadLatestBackup(): Promise<BackupData | null> {
        if (!this.settings.enabled || !this.settings.folderId || !this.settings.clientId || !this.settings.apiKey) {
            return null;
        }

        try {
            // Find all backup files
            const files = await this.listBackupFiles();

            if (files.length === 0) {
                return null;
            }

            // Get the most recent backup
            const latestFile = files.sort((a, b) =>
                new Date(b.name).getTime() - new Date(a.name).getTime()
            )[0];

            const content = await this.downloadFile(latestFile.id!);
            const backupData = JSON.parse(content) as BackupData;

            // Convert date strings back to Date objects
            return {
                ...backupData,
                filmRolls: backupData.filmRolls.map(roll => ({
                    ...roll,
                    createdAt: new Date(roll.createdAt)
                })),
                cameras: backupData.cameras.map(camera => ({
                    ...camera,
                    createdAt: new Date(camera.createdAt)
                })),
                exposures: backupData.exposures.map(exposure => ({
                    ...exposure,
                    capturedAt: new Date(exposure.capturedAt)
                })),
                exportedAt: new Date(backupData.exportedAt)
            };
        } catch (error) {
            console.error('Failed to download backup:', error);
            return null;
        }
    }

    private async findBackupFile(fileName: string): Promise<GoogleDriveFile | null> {
        const files = await this.listBackupFiles();
        return files.find(file => file.name === fileName) || null;
    }

    private async listBackupFiles(): Promise<GoogleDriveFile[]> {
        const headers = await this.getHeaders();
        const response = await fetch(
            this.getApiUrl(`/files?q='${this.settings.folderId}' in parents and name contains 'film-photography-backup'`),
            { headers }
        );

        if (!response.ok) {
            throw new Error(`Failed to list files: ${response.statusText}`);
        }

        const data = await response.json();
        return data.files || [];
    }

    private async createFile(fileName: string, content: string): Promise<void> {
        // Use multipart upload for creating file with content in one request
        const metadata = {
            name: fileName,
            parents: [this.settings.folderId!],
            mimeType: 'application/json'
        };

        const delimiter = '-------314159265358979323846';
        const close_delim = `\r\n--${delimiter}--`;

        let body = `--${delimiter}\r\n`;
        body += 'Content-Type: application/json\r\n\r\n';
        body += JSON.stringify(metadata) + '\r\n';
        body += `--${delimiter}\r\n`;
        body += 'Content-Type: application/json\r\n\r\n';
        body += content;
        body += close_delim;

        const headers = await this.getHeaders();
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': `multipart/related; boundary="${delimiter}"`,
                },
                body: body
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create file error:', errorText);
            throw new Error(`Failed to create file: ${response.statusText} - ${errorText}`);
        }
    }

    private async updateFile(fileId: string, content: string): Promise<void> {
        const headers = await this.getHeaders();
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: content
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Update file error:', errorText);
            throw new Error(`Failed to update file: ${response.statusText} - ${errorText}`);
        }
    }

    private async downloadFile(fileId: string): Promise<string> {
        const headers = await this.getHeaders();
        const response = await fetch(
            this.getApiUrl(`/files/${fileId}?alt=media`),
            { headers }
        );

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        return await response.text();
    }

    async getLastSyncTime(): Promise<Date | null> {
        try {
            const backup = await this.downloadLatestBackup();
            return backup ? backup.exportedAt : null;
        } catch {
            return null;
        }
    }
}