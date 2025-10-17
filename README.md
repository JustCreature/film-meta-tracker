# Film Photography Tracker

A Progressive Web App (PWA) built with React, TypeScript, and Material-UI for tracking film photography metadata. This app helps film photographers record and organize their shots with detailed exposure information, location data, and custom notes.

## Features

### 🎬 Film Roll Setup
- Configure film parameters (name, ISO, number of exposures)
- Beautiful setup screen with film photography branding

### 📸 Photo Capture & Settings
- Live camera view with photo capture capability
- Choose photos from device gallery
- Record exposure settings:
  - Aperture (f-stop)
  - Shutter speed
  - Additional notes
- Automatic location capture (with permission)
- Exposure counter with remaining shots display

### 🖼️ Gallery View
- Grid view of all captured exposures
- Quick preview of settings and metadata
- Empty state for new film rolls
- Click to view detailed information
- **Import/Export functionality** for data backup and sharing

### 📝 Detailed Editing
- Full-screen photo view
- Edit all metadata fields
- Change/replace photos
- View capture time and location
- Save changes with validation

### 💾 Local Storage & PWA
- All data stored locally on device
- Works offline after initial load
- PWA manifest for mobile installation
- Service worker for caching

### 📤 Import/Export
- **Export to Local**: Download all photos and metadata as files
- **Export to Google Drive**: Save directly to Google Drive (requires setup)
- **Import from Local**: Select exported files from device
- **Import from Google Drive**: Import from Google Drive folder (requires setup)
- JSON metadata format for easy data portability

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **PWA**: Vite PWA plugin with Workbox
- **Storage**: Browser LocalStorage API
- **Camera**: MediaDevices API
- **Location**: Geolocation API

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern browser with camera support
- HTTPS connection (required for camera access)

### Installation

1. Clone and enter the project directory:
```bash
cd film-meta-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Usage

### Setting Up a Film Roll

1. Open the app and you'll see the setup screen
2. Enter your film details:
   - **Film Name**: e.g., "Kodak Portra 400"
   - **ISO**: Film sensitivity (25-6400)
   - **Exposures**: Number of shots (1-100)
3. Click "Start Film Roll"

### Taking Photos

1. In the camera screen, you can:
   - Tap camera settings chips to adjust aperture, shutter speed, and add notes
   - Use the large camera button to capture or start camera
   - Use "Gallery" button to select existing photos
   - View exposure counter in top header
2. Each photo automatically captures:
   - Current date/time
   - Location (if permission granted)
   - Your manual settings

### Managing Your Shots

1. **Gallery View**: Tap the gallery icon to see all exposures
2. **Details View**: Tap any exposure to view/edit details
3. **Editing**: Use the edit button to modify settings and notes
4. **Photo Changes**: Replace photos using camera or gallery options

### Import/Export Data

#### Exporting Your Film Data
1. In the gallery view, tap the **Export** button
2. Enter a folder name for your export
3. Choose export method:
   - **Local Download**: Downloads all files to your device
   - **Google Drive**: Saves to Google Drive (requires API setup)
4. Click **Export** to start the process

#### Importing Film Data
1. In the gallery view, tap the **Import** button
2. Choose import method:
   - **Local Files**: Select the exported files from your device
   - **Google Drive**: Enter the folder name in Google Drive
3. Click **Import** to restore your data

**Export Format:**
- `metadata.json`: Contains all film roll and exposure information
- `exposure_X_ID.jpg`: Individual photos with numbered naming
- All files organized in a single folder for easy management

## Project Structure

```
src/
├── components/          # React components
│   ├── SetupScreen.tsx     # Film roll configuration
│   ├── CameraScreen.tsx    # Photo capture interface
│   ├── GalleryScreen.tsx   # Exposure list view
│   └── DetailsScreen.tsx   # Individual exposure details
├── utils/              # Utility functions
│   ├── storage.ts         # LocalStorage management
│   └── camera.ts          # Camera and file utilities
├── types.ts            # TypeScript type definitions
└── App.tsx            # Main application component
```

## Browser Compatibility

- **Camera Access**: Chrome 53+, Firefox 36+, Safari 11+
- **PWA Features**: Chrome 40+, Firefox 44+, Safari 11.1+
- **Local Storage**: All modern browsers
- **Geolocation**: All modern browsers

## Privacy & Security

- **Local Storage Only**: All data stays on your device
- **No Server Communication**: App works completely offline
- **Permission-Based**: Camera and location access require user consent
- **No Tracking**: No analytics or data collection

## Google Drive Integration (Optional)

The app supports Google Drive integration for cloud backup, but requires additional setup:

### Setting Up Google Drive API

1. **Create a Google Cloud Project**:
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   
2. **Enable Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it

3. **Create Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Restrict the API key to Google Drive API

4. **Add Google APIs JavaScript Client**:
   ```html
   <!-- Add to index.html -->
   <script src="https://apis.google.com/js/api.js"></script>
   ```

5. **Initialize in your app**:
   - Update the `googleDriveUtils.isAvailable()` function
   - Implement authentication flow
   - Handle file upload/download operations

**Note**: Without Google Drive setup, all import/export operations will use local file downloads, which works perfectly for most use cases.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## Deployment

### Vercel
```bash
npm run build
npx vercel --prod
```

### Netlify
```bash
npm run build
npx netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run build
# Deploy dist/ directory to gh-pages branch
```

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Material-UI for the component library
- Vite for the fast build tool
- Workbox for PWA capabilities
- The film photography community for inspiration


