// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // allows describe(), it(), expect() without importing
    environment: 'happy-dom', // use "node" if testing backend/server code
    include: ['src/tests/**/*.test.ts'] // customize test file locations
  }
});
