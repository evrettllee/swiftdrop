import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { type FullConfig, request } from '@playwright/test';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../src/shared/api/request-config';
import { COURIER_STATE_PATH } from './support/courier-session';

// Signs the seeded courier in once for the whole run and saves the session, so that the specs of
// the courier do not use up the sign-in limit of the backend (AUTH_THROTTLE). Nothing is printed:
// neither the account nor the answer. Without the account, or when the sign-in fails, the specs
// sign in through the form as before.
export default async function globalSetup(config: FullConfig): Promise<void> {
  // A session of an earlier run is not to be taken for this one.
  rmSync(COURIER_STATE_PATH, { force: true });

  const email = process.env.E2E_COURIER_EMAIL ?? '';
  const password = process.env.E2E_COURIER_PASSWORD ?? '';
  const baseURL = config.projects[0]?.use.baseURL;

  if (email === '' || password === '' || baseURL === undefined) {
    return;
  }

  const context = await request.newContext({ baseURL });

  try {
    const response = await context.post(`${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, {
      headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      data: { email, password },
    });

    if (response.ok()) {
      mkdirSync(dirname(COURIER_STATE_PATH), { recursive: true });
      await context.storageState({ path: COURIER_STATE_PATH });
    } else {
      console.warn(`The courier did not sign in at the setup (status ${response.status()})`);
    }
  } finally {
    await context.dispose();
  }
}
