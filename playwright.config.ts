import * as fs from 'node:fs';
import { defineConfig } from '@playwright/test';

// Some dev machines pre-provision a Chromium build; CI installs
// Playwright's own browsers instead.
const localChromium = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: fs.existsSync(localChromium) ? { executablePath: localChromium } : {},
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      // A test-mode build: no VITE_FIREBASE_* vars, so the app targets
      // the local Realtime Database emulator (start it separately with
      // `npm run emulators`).
      command: 'npm run e2e:serve',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
