import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SERVICE_FAILURE_CODE as CODE } from '@/common/constants/service-failure-codes.constants';
import { SERVICE_NAME as NAME } from '@/common/enums/service-name.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import { getAdminAnalytics } from '@test/support/admin-analytics';
import { insertFailures } from '@test/support/admin-analytics-blocks';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import { resetTestData } from '@test/support/database';

const RECENT_PERIOD = { from: '2026-11-01', to: '2026-11-02' };

describe('Admin analytics service (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    admin = await createAdmin(app, db);
    const server = { service: NAME.SERVER, code: CODE.server.INTERNAL_ERROR };
    await insertFailures(db, [
      { ...server, firstAt: '2026-09-30T20:00:00Z', lastAt: '2026-10-01T09:00:00Z', repeats: 3 },
      { ...server, lastAt: '2026-10-03T09:00:00Z', repeats: 2 },
      { ...server, lastAt: '2026-09-28T09:00:00Z', repeats: 4 },
      { ...server, lastAt: '2026-10-08T09:00:00Z', repeats: 9 },
      { service: NAME.OSRM, code: CODE.osrm.TIMEOUT, lastAt: '2026-10-02T09:00:00Z', repeats: 2 },
      { service: NAME.OSRM, code: CODE.osrm.BAD_RESPONSE, lastAt: '2026-10-05T09:00:00Z' },
      {
        service: NAME.MAIL,
        code: CODE.mail.SEND_FAILED,
        lastAt: '2026-10-04T10:00:00Z',
        repeats: 3,
      },
      { service: NAME.MAIL, code: CODE.mail.TIMEOUT, lastAt: '2026-10-06T09:00:00Z' },
      {
        service: NAME.NBRB,
        code: CODE.nbrb.SAVED_RATE_USED,
        lastAt: '2026-10-03T09:00:00Z',
        repeats: 6,
      },
      {
        service: NAME.STRIPE,
        code: CODE.stripe.API_ERROR,
        lastAt: '2026-09-27T09:00:00Z',
        repeats: 2,
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sum the repeats of the failures last seen in the period', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'service', PERIOD).expect(HttpStatus.OK);

    expect(body.period).toEqual(PERIOD);
    expect(body.kpis).toEqual({
      serverErrors: { value: 5, previous: 4 },
      externalFailures: {
        value: { failures: 13, services: 3 },
        previous: { failures: 2, services: 1 },
      },
      mailFailures: { count: 4, lastAt: '2026-10-06T09:00:00.000Z' },
      savedRateUsed: 6,
    });
    expect(body.serverErrorsByDay.map((day: { count: number }) => day.count)).toEqual([
      3, 0, 2, 0, 0, 0, 0,
    ]);
  });

  it('should always give the four external services', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'service', PERIOD).expect(HttpStatus.OK);

    expect(body.services).toEqual([
      {
        service: 'osrm',
        failures: 3,
        lastAt: '2026-10-05T09:00:00.000Z',
        lastCode: 'bad_response',
      },
      {
        service: 'nbrb',
        failures: 6,
        lastAt: '2026-10-03T09:00:00.000Z',
        lastCode: 'saved_rate_used',
      },
      { service: 'mail', failures: 4, lastAt: '2026-10-06T09:00:00.000Z', lastCode: 'timeout' },
      { service: 'stripe', failures: 0, lastAt: null, lastCode: null },
    ]);
    expect(body.recent[0]).toEqual({
      lastAt: '2026-10-06T09:00:00.000Z',
      firstAt: '2026-10-06T09:00:00.000Z',
      service: 'mail',
      code: 'timeout',
      message: 'Connection timed out',
      repeats: 1,
    });
    expect(body.recent).toHaveLength(7);
  });

  it('should cap the recent failures at the 20 newest', async () => {
    await insertFailures(
      db,
      Array.from({ length: 25 }, (_, index) => ({
        service: NAME.OSRM,
        code: CODE.osrm.TIMEOUT,
        lastAt: new Date(Date.UTC(2026, 10, 1, 6, index)).toISOString(),
        message: `Route ${index}`,
      })),
    );

    const { body } = await getAdminAnalytics(app, admin, 'service', RECENT_PERIOD).expect(
      HttpStatus.OK,
    );

    expect(body.recent.map((row: { message: string }) => row.message)).toEqual(
      Array.from({ length: 20 }, (_, index) => `Route ${24 - index}`),
    );
    expect(body.services[0]).toMatchObject({ service: 'osrm', failures: 25 });
  });
});
