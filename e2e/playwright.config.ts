import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end flows against the running stack (pnpm infra:up, API on :4000 in mock-payment mode, web on :3000,
 * the Expo app's web build on :8090 (8081 is often another project's Metro)). Web flows run as desktop Chrome, iPhone Safari (WebKit) and Android Chrome;
 * the app's flows run its React Native code in the same two phone browsers.
 */
const WEB = process.env.E2E_WEB ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', actionTimeout: 15_000 },
  projects: [
    { name: 'desktop-chrome', testMatch: /web-.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: WEB } },
    { name: 'iphone-safari', testMatch: /web-(public|customer)\.spec\.ts/, use: { ...devices['iPhone 15'], baseURL: WEB } },
    { name: 'android-chrome', testMatch: /web-(public|customer)\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: WEB } },
    { name: 'app-iphone', testMatch: /app-.*\.spec\.ts/, use: { ...devices['iPhone 15'], baseURL: process.env.E2E_APP ?? 'http://localhost:8090' } },
    { name: 'app-iphone-se', testMatch: /app-.*\.spec\.ts/, use: { ...devices['iPhone SE'], baseURL: process.env.E2E_APP ?? 'http://localhost:8090' } },
    { name: 'app-android', testMatch: /app-.*\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: process.env.E2E_APP ?? 'http://localhost:8090' } },
  ],
});
