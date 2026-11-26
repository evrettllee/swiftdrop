import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const WINDOW_MS = 61_000;
const WRITES_ALLOWED = 18;
const LOGINS_ALLOWED = 9;
const LOCK_RETRY_MS = 25;
const LOCK_STALE_MS = 10_000;
const MIN_WAIT_MS = 50;
const STATE_FILE = join(tmpdir(), 'swiftdrop-e2e-rate-window.json');
const LOCK_FILE = join(tmpdir(), 'swiftdrop-e2e-rate-window.lock');

type Bucket = 'writes' | 'logins';
type PaceState = Record<Bucket, number[]>;

function isAlreadyExists(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EEXIST';
}

function clearStaleLock(): void {
  try {
    const age = Date.now() - statSync(LOCK_FILE).mtimeMs;

    if (age > LOCK_STALE_MS) {
      unlinkSync(LOCK_FILE);
    }
  } catch {
    return;
  }
}

async function acquireLock(): Promise<number> {
  while (true) {
    try {
      return openSync(LOCK_FILE, 'wx');
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }

      clearStaleLock();
      await delay(LOCK_RETRY_MS);
    }
  }
}

function parseTimestamps(raw: unknown, now: number): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(
    (entry): entry is number =>
      typeof entry === 'number' && Number.isFinite(entry) && now - entry < WINDOW_MS,
  );
}

function readState(now: number): PaceState {
  if (!existsSync(STATE_FILE)) {
    return { writes: [], logins: [] };
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(STATE_FILE, 'utf8'));

    if (typeof parsed !== 'object' || parsed === null) {
      return { writes: [], logins: [] };
    }

    const record = parsed as Record<string, unknown>;

    return {
      writes: parseTimestamps(record.writes, now),
      logins: parseTimestamps(record.logins, now),
    };
  } catch {
    return { writes: [], logins: [] };
  }
}

async function withLock<T>(fn: () => T): Promise<T> {
  const fd = await acquireLock();

  try {
    return fn();
  } finally {
    closeSync(fd);

    try {
      unlinkSync(LOCK_FILE);
    } catch {
      void 0;
    }
  }
}

async function paceBucket(bucket: Bucket, allowed: number): Promise<void> {
  while (true) {
    const waitMs = await withLock(() => {
      const now = Date.now();
      const state = readState(now);
      const bucketTimes = state[bucket];

      if (bucketTimes.length < allowed) {
        bucketTimes.push(now);
        writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');

        return 0;
      }

      return Math.max(MIN_WAIT_MS, bucketTimes[0] + WINDOW_MS - now);
    });

    if (waitMs === 0) {
      return;
    }

    await delay(waitMs);
  }
}

export async function paceAdminWrite(): Promise<void> {
  await paceBucket('writes', WRITES_ALLOWED);
}

export async function paceStandLogin(): Promise<void> {
  await paceBucket('logins', LOGINS_ALLOWED);
}
