import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert, Button } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { MainScreen } from './components/MainScreen';
import { SetupScreen } from './components/SetupScreen';
import { CameraScreen } from './components/CameraScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { DetailsScreen } from './components/DetailsScreen';
import { SettingsModal } from './components/SettingsModal';
import { storage } from './utils/storage';
import { SyncManager } from './utils/syncManager';
import type { FilmRoll, Exposure, AppState, Camera, AppSettings } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentFilmRoll: null,
    filmRolls: [],
    cameras: [],
    exposures: [],
    currentScreen: 'filmrolls',
    selectedExposure: null,
    settings: {
      googleDrive: {
        enabled: false,
        autoSync: false
      },
      version: '1.0.0'
    }
  });

  const [pwaUpdateAvailable, setPwaUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const currentFilmRoll = storage.getCurrentFilmRoll();
    const filmRolls = storage.getFilmRolls();
    const cameras = storage.getCameras();
    const exposures = storage.getExposures();
    const settings = storage.getSettings();

    setAppState(prev => ({
      ...prev,
      currentFilmRoll,
      filmRolls,
      cameras,
      exposures,
      settings,
      currentScreen: filmRolls.length > 0 ? 'filmrolls' : 'setup'
    }));

    // Initialize sync manager
    const manager = new SyncManager(settings);
    setSyncManager(manager);

    // Perform auto-sync if enabled
    if (settings.googleDrive.enabled && settings.googleDrive.autoSync) {
      manager.performAutoSync().then(result => {
        if (result.success && result.action === 'download') {
          // If data was downloaded from cloud, reload the app state
          console.log('🔄 Sync:', result.message);
          // Optionally refresh the page or reload data here
        } else if (result.success && result.action === 'upload') {
          console.log('☁️ Sync:', result.message);
        } else if (!result.success) {
          console.warn('⚠️ Sync failed:', result.message);
        }
      }).catch(error => {
        console.error('Sync error:', error);
      });
    }
  }, []);

  // PWA update handling - Manual updates only to preserve user data
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('🔧 PWA: Service worker supported');
      navigator.serviceWorker.ready.then(registration => {
        console.log('🔧 PWA: Service worker ready', registration);
        // Check if there's already a waiting worker
        if (registration.waiting) {
          console.log('🔧 PWA: Update available (waiting worker found)');
          setPwaUpdateAvailable(true);
          setWaitingWorker(registration.waiting);
        }

        // Listen for new service worker installations
        registration.addEventListener('updatefound', () => {
          console.log('🔧 PWA: Update found, new worker installing');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('🔧 PWA: New worker state:', newWorker.state);
              // When the new service worker is installed and there's an existing one
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔧 PWA: Update ready! Showing notification');
                setPwaUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });

        // Check for updates less frequently to avoid interruptions
        setInterval(() => {
          console.log('🔧 PWA: Checking for updates...');
          registration.update();
        }, 300000); // Check every 5 minutes
      });
    } else {
      console.log('❌ PWA: Service worker not supported');
    }
  }, []);

  const handleFilmRollCreated = (filmRoll: FilmRoll) => {
    storage.saveFilmRoll(filmRoll);
    storage.setCurrentFilmRoll(filmRoll);

    setAppState(prev => ({
      ...prev,
      currentFilmRoll: filmRoll,
      filmRolls: [...prev.filmRolls.filter(r => r.id !== filmRoll.id), filmRoll],
      currentScreen: 'camera'
    }));
  };

  const handleFilmRollSelected = (filmRoll: FilmRoll) => {
    storage.setCurrentFilmRoll(filmRoll);

    setAppState(prev => ({
      ...prev,
      currentFilmRoll: filmRoll,
      currentScreen: 'camera'
    }));
  };

  const handleFilmRollDeleted = (filmRollId: string) => {
    setAppState(prev => ({
      ...prev,
      filmRolls: prev.filmRolls.filter(r => r.id !== filmRollId),
      currentFilmRoll: prev.currentFilmRoll?.id === filmRollId ? null : prev.currentFilmRoll,
      exposures: prev.exposures.filter(e => e.filmRollId !== filmRollId)
    }));
  };

  // Camera handlers
  const handleCameraCreated = (camera: Camera) => {
    storage.saveCamera(camera);

    setAppState(prev => ({
      ...prev,
      cameras: [...prev.cameras.filter(c => c.id !== camera.id), camera]
    }));
  };

  const handleCameraUpdated = (camera: Camera) => {
    storage.saveCamera(camera);

    setAppState(prev => ({
      ...prev,
      cameras: prev.cameras.map(c => c.id === camera.id ? camera : c)
    }));
  };

  const handleCameraDeleted = (cameraId: string) => {
    storage.deleteCamera(cameraId);

    setAppState(prev => ({
      ...prev,
      cameras: prev.cameras.filter(c => c.id !== cameraId)
    }));
  };

  const handleExposureTaken = (exposure: Exposure) => {
    storage.saveExposure(exposure);

    setAppState(prev => ({
      ...prev,
      exposures: [...prev.exposures.filter(e => e.id !== exposure.id), exposure]
    }));
  };

  const handleExposureUpdate = (exposure: Exposure) => {
    storage.saveExposure(exposure);

    setAppState(prev => ({
      ...prev,
      exposures: prev.exposures.map(e => e.id === exposure.id ? exposure : e),
      selectedExposure: exposure
    }));
  };

  const handlePwaUpdate = () => {
    // Ask for confirmation to ensure user wants to update
    const confirmed = window.confirm(
      'Update the app to the latest version?\n\n' +
      'The app will reload and your current progress will be preserved.\n\n' +
      'Click OK to update or Cancel to continue with the current version.'
    );

    if (!confirmed) {
      return;
    }

    setPwaUpdateAvailable(false);

    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting and become active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });

      // Listen for when it becomes activated, then reload
      waitingWorker.addEventListener('statechange', () => {
        if (waitingWorker.state === 'activated') {
          window.location.reload();
        }
      });
    } else {
      // Fallback: just reload immediately
      window.location.reload();
    }
  };

  const handleDataImported = (filmRoll: FilmRoll, exposures: Exposure[]) => {
    // Update current film roll and exposures
    setAppState(prev => ({
      ...prev,
      currentFilmRoll: filmRoll,
      filmRolls: [...prev.filmRolls.filter(r => r.id !== filmRoll.id), filmRoll],
      exposures: [...prev.exposures.filter(e => e.filmRollId !== filmRoll.id), ...exposures],
      currentScreen: 'gallery'
    }));

    // Update storage
    storage.setCurrentFilmRoll(filmRoll);
  };

  const navigateToScreen = (screen: AppState['currentScreen'], selectedExposure?: Exposure) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      selectedExposure: selectedExposure || null
    }));
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setAppState(prev => ({
      ...prev,
      settings: newSettings
    }));

    // Update sync manager with new settings
    syncManager?.updateSettings(newSettings);
  };

  const handleManualSync = async () => {
    if (!syncManager) {
      throw new Error('Sync manager not initialized');
    }

    const result = await syncManager.performAutoSync();
    if (!result.success) {
      throw new Error(result.message);
    }

    console.log('Manual sync completed:', result.message);
  };

  const renderCurrentScreen = () => {
    switch (appState.currentScreen) {
      case 'filmrolls':
        return (
          <MainScreen
            filmRolls={appState.filmRolls}
            exposures={appState.exposures}
            cameras={appState.cameras}
            onFilmRollSelected={handleFilmRollSelected}
            onFilmRollCreated={handleFilmRollCreated}
            onFilmRollDeleted={handleFilmRollDeleted}
            onCameraCreated={handleCameraCreated}
            onCameraUpdated={handleCameraUpdated}
            onCameraDeleted={handleCameraDeleted}
            onSettingsClick={() => setShowSettings(true)}
          />
        );

      case 'setup':
        return (
          <SetupScreen
            cameras={appState.cameras}
            onFilmRollCreated={handleFilmRollCreated}
          />
        );

      case 'camera':
        if (!appState.currentFilmRoll) return null;
        return (
          <CameraScreen
            filmRoll={appState.currentFilmRoll}
            exposures={appState.exposures}
            onExposureTaken={handleExposureTaken}
            onOpenGallery={() => navigateToScreen('gallery')}
            onBack={() => navigateToScreen('filmrolls')}
          />
        );

      case 'gallery':
        if (!appState.currentFilmRoll) return null;
        return (
          <GalleryScreen
            filmRoll={appState.currentFilmRoll}
            exposures={appState.exposures}
            onExposureSelect={(exposure) => navigateToScreen('details', exposure)}
            onBack={() => navigateToScreen('camera')}
            onDataImported={handleDataImported}
          />
        );

      case 'details':
        if (!appState.selectedExposure) return null;
        return (
          <DetailsScreen
            exposure={appState.selectedExposure}
            onExposureUpdate={handleExposureUpdate}
            onBack={() => navigateToScreen('gallery')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderCurrentScreen()}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={appState.settings}
        onSettingsChange={handleSettingsChange}
        onManualSync={handleManualSync}
      />

      {/* PWA Update Notification */}
      <Snackbar
        open={pwaUpdateAvailable}
        onClose={() => setPwaUpdateAvailable(false)}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <>
              <Button color="inherit" size="small" onClick={() => setPwaUpdateAvailable(false)}>
                Later
              </Button>
              <Button color="inherit" size="small" onClick={handlePwaUpdate} sx={{ ml: 1 }}>
                Update
              </Button>
            </>
          }
        >
          New version available! Your data will be preserved.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;