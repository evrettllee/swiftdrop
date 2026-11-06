import type { Page } from '@playwright/test';

const MINSK_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Minsk' });
const MINSK_NOON_UTC = 'T09:00:00Z';

export const FIXED_NOW = new Date(`${MINSK_DAY.format(new Date())}${MINSK_NOON_UTC}`);

const pinned = new WeakSet<Page>();

export function fromFixedNow(ms: number): Date {
  return new Date(FIXED_NOW.getTime() + ms);
}

export async function fixClock(page: Page): Promise<void> {
  if (pinned.has(page)) {
    return;
  }

  pinned.add(page);
  await page.clock.setFixedTime(FIXED_NOW);
}

export async function runClockFromFixedNow(page: Page): Promise<void> {
  pinned.add(page);
  await page.clock.install({ time: FIXED_NOW });
}
