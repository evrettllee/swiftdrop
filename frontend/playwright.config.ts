import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
// Any public endpoint: an anonymous /api/auth/me answers 401, which means the backend is up.
const BACKEND_READY_URL = 'http://localhost:8080/api/auth/me';
// The backend compiles before it listens.
const SERVER_START_TIMEOUT_MS = 180_000;

// The end-to-end tests of the frontend: the real dev servers of the frontend and the backend,
// with Mapbox and Stripe replaced in the browser (e2e/support). The database must be up, migrated
// and seeded.
export default defineConfig({
  testDir: './e2e',
  tsconfig: './e2e/tsconfig.json',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: SERVER_START_TIMEOUT_MS,
      // The address search and the map send requests only with a token. Its value does not
      // matter: every Mapbox request is answered by the tests. A variable of the process wins
      // over the .env file in Vite.
      env: { VITE_MAPBOX_TOKEN: 'pk.e2e-placeholder' },
    },
    {
      command: 'npm run start:dev',
      cwd: '../backend',
      url: BACKEND_READY_URL,
      reuseExistingServer: true,
      timeout: SERVER_START_TIMEOUT_MS,
      // The backend requires it; a .env made before it became required may lack it.
      env: { NODE_ENV: 'development' },
    },
  ],
});
