import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: 'http://localhost:8081',
  },
});
