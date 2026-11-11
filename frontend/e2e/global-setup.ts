import { execFileSync } from 'node:child_process';
import { type FullConfig, request } from '@playwright/test';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../src/shared/api/request-config';
import { STAND, STAND_ENV } from './support/stand';
import { warmUpPages } from './support/stand-warmup';

const BACKEND_DIR = '../backend';
const SEED_TIMEOUT_MS = 180_000;

function seedStand(): void {
  execFileSync('npm', ['run', 'e2e:seed'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, ...STAND_ENV },
    stdio: 'inherit',
    shell: true,
    timeout: SEED_TIMEOUT_MS,
  });
}

async function signInCourier(baseURL: string): Promise<void> {
  const context = await request.newContext({ baseURL });

  try {
    const response = await context.post(`${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, {
      headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      data: { email: STAND.COURIER_EMAIL, password: STAND.COURIER_PASSWORD },
    });

    if (!response.ok()) {
      throw new Error(`The courier of the stand did not sign in (status ${response.status()})`);
    }
  } finally {
    await context.dispose();
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;

  if (baseURL === undefined) {
    throw new Error('The stand needs the base URL of the frontend');
  }

  seedStand();
  await signInCourier(baseURL);
  await warmUpPages(baseURL);
}
