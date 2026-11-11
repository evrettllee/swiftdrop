import { defineConfig, devices } from '@playwright/test';
import { STAND, STAND_BACKEND_URL, STAND_ENV, STAND_FRONTEND_URL } from './e2e/support/stand';

Object.assign(process.env, STAND_ENV);

const BACKEND_READY_URL = `${STAND_BACKEND_URL}/api/auth/me`;
const SERVER_START_TIMEOUT_MS = 180_000;

// The specs that use the one seeded courier (the line, the vehicle, the orders it carries): they
// cannot run at the same time, so they make a project of their own with one worker. The other
// specs run in parallel with them; the courier of those is a stub.
const SEEDED_COURIER_SPECS =
  /(courier-(cabinet|delivery-code|history-order|history-url|history|offer-route|offer|order-map|order|shift|vehicle)|delivery-flow)\.spec\.ts$/;

export default defineConfig({
  testDir: './e2e',
  tsconfig: './e2e/tsconfig.json',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: STAND_FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  globalSetup: './e2e/global-setup.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: SEEDED_COURIER_SPECS,
    },
    {
      name: 'courier',
      use: { ...devices['Desktop Chrome'] },
      testMatch: SEEDED_COURIER_SPECS,
      fullyParallel: false,
      workers: 1,
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${STAND.FRONTEND_PORT} --strictPort`,
      url: STAND_FRONTEND_URL,
      reuseExistingServer: false,
      timeout: SERVER_START_TIMEOUT_MS,
      env: { VITE_MAPBOX_TOKEN: 'pk.e2e-placeholder', API_PROXY_TARGET: STAND_BACKEND_URL },
    },
    {
      command: 'npm run start:e2e',
      cwd: '../backend',
      url: BACKEND_READY_URL,
      reuseExistingServer: false,
      timeout: SERVER_START_TIMEOUT_MS,
      env: {
        NODE_ENV: 'development',
        PORT: String(STAND.BACKEND_PORT),
        APP_URL: STAND_FRONTEND_URL,
        STRIPE_WEBHOOK_SECRET: STAND.WEBHOOK_SECRET,
      },
    },
  ],
});
