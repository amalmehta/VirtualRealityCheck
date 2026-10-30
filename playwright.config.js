import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.e2e.js',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4173', trace: 'off' },
  webServer: { command: 'python3 -m http.server 4173', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['iPhone 13'] } },
  ],
});
