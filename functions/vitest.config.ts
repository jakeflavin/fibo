import { defineConfig } from 'vitest/config';

/*
 * Explicit for the same reason as packages/shared: without it vitest walks up past the
 * checkout and adopts whatever config is above it.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
