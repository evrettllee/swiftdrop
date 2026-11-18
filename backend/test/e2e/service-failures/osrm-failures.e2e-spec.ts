import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OSRM_UNAVAILABLE_MESSAGE } from '@/integrations/osrm/constants/osrm.constants';
import { createTestApp } from '@test/support/app';
import { resetTestData, seedServiceArea } from '@test/support/database';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postEstimate, validEstimate } from '@test/support/pricing';
import {
  readFailures,
  statusResponse,
  stubFetch,
  timeoutError,
  waitForFailures,
} from '@test/support/service-failures';

describe('OSRM failures during a quote (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    await seedServiceArea(db);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer as before and record a timeout without the points of the route', async () => {
    stubFetch(() => Promise.reject(timeoutError()));

    const { body } = await postEstimate(app, validEstimate).expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(body.message).toBe(OSRM_UNAVAILABLE_MESSAGE);
    const rows = await waitForFailures(db, 1);
    expect(rows).toEqual([
      expect.objectContaining({
        service: 'osrm',
        code: 'timeout',
        message: 'Нет ответа за 5 с',
        repeats: 1,
      }),
    ]);
    expect(JSON.stringify(rows)).not.toContain(String(MINSK_PICKUP.latitude));
  });

  it('should merge two 503 answers within ten minutes into one row', async () => {
    stubFetch(() => Promise.resolve(statusResponse(HttpStatus.SERVICE_UNAVAILABLE)));

    await postEstimate(app, validEstimate).expect(HttpStatus.SERVICE_UNAVAILABLE);
    await waitForFailures(db, 2);
    await postEstimate(app, validEstimate).expect(HttpStatus.SERVICE_UNAVAILABLE);
    await waitForFailures(db, 3);

    expect((await readFailures(db)).map((row) => [row.code, row.message, row.repeats])).toEqual([
      ['timeout', 'Нет ответа за 5 с', 1],
      ['unavailable', 'HTTP 503', 2],
    ]);
  });
});
