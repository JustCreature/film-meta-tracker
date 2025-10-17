import { Page } from '@playwright/test';

/**
 * Page Object Model for Film Photography Tracker
 * Provides reusable methods for interacting with  async createCamera(data: {
    make: string;
    model: string;
    lens?: string;
  }) {
    await this.addCameraButton.click();
    await this.addCameraButton.waitFor({ state: 'hidden' }); // Wait for navigation
    await this.cameraMakeInput.fill(data.make);
    await this.cameraModelInput.fill(data.model);
    
    if (data.lens) {
      await this.cameraLensInput.fill(data.lens);
    }
    
    await this.addCameraSubmitButton.click();
  }n
 */
export class FilmTrackerPage {
  constructor(public page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/');
  }

  async waitForLoadState() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Main Screen Elements
  get filmRollsTab() {
    return this.page.getByRole('tab', { name: /film rolls/i });
  }

  get camerasTab() {
    return this.page.getByRole('tab', { name: /cameras/i });
  }

  get createFilmRollButton() {
    return this.page.getByRole('button', { name: /create film roll/i });
  }

  get addCameraButton() {
    return this.page.getByRole('button', { name: 'Add Camera', exact: true });
  }

  get settingsButton() {
    return this.page.getByRole('button', { name: /settings/i });
  }

  // Film Roll Creation
  get filmNameInput() {
    return this.page.getByLabel(/film name/i);
  }

  get isoInput() {
    return this.page.getByLabel(/iso/i);
  }

  get exposuresInput() {
    return this.page.getByLabel(/number of exposures/i);
  }

  get cameraSelect() {
    return this.page.getByLabel(/camera.*optional/i);
  }

  get startFilmRollButton() {
    return this.page.getByRole('button', { name: /start film roll/i });
  }

  get updateFilmRollButton() {
    return this.page.getByRole('button', { name: /update film roll/i });
  }

  // Camera Management
  get cameraMakeInput() {
    return this.page.getByLabel(/camera make/i);
  }

  get cameraModelInput() {
    return this.page.getByLabel(/camera model/i);
  }

  get lensInput() {
    return this.page.getByLabel(/lens/i);
  }

  get addCameraSubmitButton() {
    return this.page.getByRole('button', { name: /add.*camera/i });
  }

  get updateCameraSubmitButton() {
    return this.page.getByRole('button', { name: /update.*camera/i });
  }

  // Camera Screen Elements
  get cameraButton() {
    return this.page.getByRole('button', { name: /camera/i }).first();
  }

  get galleryButton() {
    return this.page.getByRole('button', { name: /gallery/i });
  }

  get apertureChip() {
    return this.page.getByText(/f\//i).first();
  }

  get shutterSpeedChip() {
    return this.page.getByText(/1\//i).first();
  }

  get notesChip() {
    return this.page.getByText(/notes/i).first();
  }

  get backButton() {
    return this.page.getByRole('button', { name: /back/i });
  }

  // Settings Dialog
  get settingsDialog() {
    return this.page.getByRole('dialog');
  }

  get closeSettingsButton() {
    return this.settingsDialog.getByRole('button', { name: /close|cancel|done/i });
  }

  // Helper Methods
  async createFilmRoll(data: {
    name: string;
    iso?: string;
    exposures?: string;
    camera?: string;
  }) {
    await this.createFilmRollButton.click();
    await this.filmNameInput.fill(data.name);
    
    if (data.iso) {
      await this.isoInput.fill(data.iso);
    }
    
    if (data.exposures) {
      await this.exposuresInput.fill(data.exposures);
    }
    
    if (data.camera) {
      await this.cameraSelect.click();
      await this.page.getByText(data.camera).click();
    }
    
    await this.startFilmRollButton.click();
  }

  async createCamera(data: {
    make: string;
    model: string;
    lens?: string;
  }) {
    await this.addCameraButton.click();
    await this.cameraMakeInput.fill(data.make);
    await this.cameraModelInput.fill(data.model);
    
    if (data.lens) {
      await this.lensInput.fill(data.lens);
    }
    
    await this.addCameraSubmitButton.click();
  }

  async getFilmRollCards() {
    return this.page.locator('[data-testid="film-roll-card"], .MuiCard-root').filter({
      has: this.page.locator('text=/film|roll|iso/i')
    });
  }

  async getCameraCards() {
    return this.page.locator('[data-testid="camera-card"], .MuiCard-root').filter({
      has: this.page.locator('text=/camera|make|model/i')
    });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async mockGeolocation() {
    await this.page.context().grantPermissions(['geolocation']);
    await this.page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  }
}