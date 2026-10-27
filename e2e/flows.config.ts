import { defineConfig, devices } from '@playwright/test';

// Real API/database state, isolated from production; only the payment transport is mocked.
process.env.E2E_API = 'http://localhost:4015/api/v1';
process.env.E2E_DB = 'postgres://valley@127.0.0.1:25432/valleyride_flow_test';
process.env.E2E_REDIS = 'redis://127.0.0.1:26379/2';
const apiEnv = {
  NODE_ENV: 'development', PORT: '4015', DATABASE_URL: process.env.E2E_DB, DATABASE_SSL: 'false', DATABASE_POOL_MAX: '5',
  REDIS_URL: process.env.E2E_REDIS, JWT_ACCESS_SECRET: 'local-flow-tests-only-not-production',
  CORS_ORIGINS: 'http://localhost:3115,http://localhost:8095', COOKIE_DOMAIN: '',
  RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '',
  SMTP_URL: 'smtp://127.0.0.1:1025', WHATSAPP_API_TOKEN: '', WHATSAPP_PHONE_NUMBER_ID: '',
  STORAGE_DRIVER: 'local', SENTRY_DSN: '', CAPITAL_PORTAL_ENABLED: 'false',
};
export default defineConfig({
  testDir: './tests', globalSetup: './global.ts', timeout: 90_000, expect: { timeout: 20_000 }, workers: 1,
  outputDir: '../builds/interaction-review/flow-results',
  reporter: [['list'], ['json', { outputFile: '../builds/interaction-review/flow-results.json' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', timezoneId: 'Asia/Kolkata', launchOptions: { executablePath: process.env.INTERACTION_BROWSER_PATH } },
  webServer: [
    { command: 'pnpm exec tsx src/server.ts', cwd: '../apps/api', env: apiEnv, url: 'http://localhost:4015/ready', reuseExistingServer: false },
    { command: 'pnpm exec next dev --hostname localhost --port 3115', cwd: '../apps/web', env: { NEXT_PUBLIC_API_URL: 'http://localhost:4015' }, url: 'http://localhost:3115', reuseExistingServer: false, timeout: 120_000 },
    { command: 'pnpm exec expo start --web --port 8095 --host localhost', cwd: '../apps/mobile', env: { CI: '1', EXPO_PUBLIC_API_URL: 'http://localhost:4015', EXPO_PUBLIC_WEB_URL: 'http://localhost:3115' }, url: 'http://localhost:8095', reuseExistingServer: false, timeout: 120_000 },
  ],
  projects: [
    { name: 'web-desktop-flows', testMatch: /web-(public|customer|admin)\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3115' } },
    { name: 'app-iphone-flows', testMatch: /app-.*\.spec\.ts/, use: { ...devices['iPhone 15'], defaultBrowserType: 'chromium', baseURL: 'http://localhost:8095' } },
    { name: 'app-android-flows', testMatch: /app-.*\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: 'http://localhost:8095' } },
    { name: 'web-phone-flows', testMatch: /web-(public|customer)\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: 'http://localhost:3115' } },
  ],
});
