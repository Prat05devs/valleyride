import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // integration tests share one Postgres database, so run files one at a time
    fileParallelism: false,
  },
});
