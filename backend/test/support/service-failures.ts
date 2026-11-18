import { asc } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { serviceFailures } from '@/database/schema';
import type { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';

const POLL_INTERVAL_MS = 50;
const POLL_TIMEOUT_MS = 3000;

export type FailureRow = typeof serviceFailures.$inferSelect;

export function readFailures(db: Database): Promise<FailureRow[]> {
  return db.select().from(serviceFailures).orderBy(asc(serviceFailures.failureId));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForFailures(db: Database, repeats: number): Promise<FailureRow[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let rows = await readFailures(db);

  while (rows.reduce((sum, row) => sum + row.repeats, 0) < repeats && Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS);
    rows = await readFailures(db);
  }

  return rows;
}

export function timeoutError(): Error {
  return Object.assign(new Error('The operation was aborted due to timeout'), {
    name: 'TimeoutError',
  });
}

export function networkError(code: string): TypeError {
  return new TypeError('fetch failed', { cause: Object.assign(new Error(code), { code }) });
}

export function stubFetch(answer: () => Promise<Response>): jest.SpiedFunction<typeof fetch> {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(answer);
}

export function statusResponse(status: number): Response {
  return new Response('<html>Service Unavailable</html>', { status });
}

export const NO_FAILURES = {
  record: () => Promise.resolve(),
} as unknown as ServiceFailuresService;
