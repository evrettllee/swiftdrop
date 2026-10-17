import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BrowserContextOptions } from '@playwright/test';

// The session of the seeded courier that the global setup of the run saves once. The sign-in of the
// backend is rate-limited, so the specs of the courier reuse this session instead of signing in
// again. The folder is ignored by git: the file holds the cookies of a session.
export const COURIER_STATE_PATH = resolve('playwright/.auth/courier.json');

type SavedCookies = NonNullable<Exclude<BrowserContextOptions['storageState'], string>>['cookies'];

// The cookies of the saved session, or null when the setup did not save one (no courier is given,
// or its sign-in failed): the specs then sign in through the form.
export function readSavedCourierCookies(): SavedCookies | null {
  try {
    const state = JSON.parse(readFileSync(COURIER_STATE_PATH, 'utf-8')) as {
      cookies?: SavedCookies;
    };

    return state.cookies ?? null;
  } catch {
    return null;
  }
}
