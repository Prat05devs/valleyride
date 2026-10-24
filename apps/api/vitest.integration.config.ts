import { defineConfig } from 'vitest/config';

/** Integration tests: Supertest against a real Postgres (valleyride_test) and Redis db 1. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://valley:valley@localhost:5432/valleyride_test',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379/1',
      JWT_ACCESS_SECRET: 'test-access-secret',
      CORS_ORIGINS: 'http://localhost:3000',
      RAZORPAY_KEY_ID: 'rzp_test_dummy',
      RAZORPAY_KEY_SECRET: 'dummy',
      RAZORPAY_WEBHOOK_SECRET: 'whsec_test',
      S3_BUCKET_PRIVATE: 'valleyride-kyc-test',
      CAPITAL_PORTAL_ENABLED: 'true',
    },
  },
});
