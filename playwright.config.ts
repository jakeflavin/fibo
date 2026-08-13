import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    // Use the machine's pre-provisioned Chromium build.
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
