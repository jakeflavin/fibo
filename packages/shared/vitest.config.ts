import { defineConfig } from 'vitest/config';

/*
 * Explicit, because without it vitest walks up the filesystem for a config and finds
 * whatever happens to be above the checkout — locally that is the portfolio directory
 * this repo is cloned inside, whose jsdom setup file does not exist here. A package's
 * tests should not depend on where the package is sitting.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
