import { defineConfig, devices } from '@playwright/test';

// Isolated UI checks: this API serves fixtures in memory and cannot modify production or charge money.
export default defineConfig({
  testDir: './interactions', timeout: 60_000, expect: { timeout: 15_000 }, workers: 1,
  outputDir: '../builds/interaction-review/test-results',
  reporter: [['list'], ['json', { outputFile: '../builds/interaction-review/results.json' }]],
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure', timezoneId: 'Asia/Kolkata', launchOptions: { executablePath: process.env.INTERACTION_BROWSER_PATH } },
  webServer: [
    { command: 'node fixtures/interaction-api.cjs', url: 'http://127.0.0.1:4100/api/v1/locations', reuseExistingServer: false },
    { command: 'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100', cwd: '../apps/web', stdout: 'pipe', env: { NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4100' }, url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 120_000 },
    { command: 'node node_modules/expo/bin/cli start --web --port 8095 --host lan', cwd: '../apps/mobile', env: { CI: '1', EXPO_PUBLIC_API_URL: 'http://127.0.0.1:4100', EXPO_PUBLIC_WEB_URL: 'http://127.0.0.1:3100' }, url: 'http://127.0.0.1:8095', reuseExistingServer: false, timeout: 120_000 },
  ],
  projects: [
    { name: 'app-iphone', testMatch: /app\.spec\.ts/, use: { ...devices['iPhone 15'], defaultBrowserType: 'chromium', baseURL: 'http://127.0.0.1:8095' } },
    { name: 'app-small-phone', testMatch: /app\.spec\.ts/, use: { ...devices['iPhone SE'], defaultBrowserType: 'chromium', baseURL: 'http://127.0.0.1:8095' } },
    { name: 'app-android', testMatch: /app\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:8095' } },
    { name: 'web-desktop', testMatch: /web\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3100' } },
    { name: 'web-phone', testMatch: /web\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:3100' } },
  ],
});
