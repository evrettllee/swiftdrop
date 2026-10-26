import { defineConfig } from '@playwright/test';

// Unit tests of the models of the app: plain functions and stores in Node, next to their code as
// *.test.ts. No browser and no servers: nothing is started for them.
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.test.ts',
  // The aliases of the layers (@/shared and the others) as the app resolves them.
  tsconfig: './tsconfig.app.json',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
});
