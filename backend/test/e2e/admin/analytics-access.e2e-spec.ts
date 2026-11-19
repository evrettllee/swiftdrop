import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { ANALYTICS_VALIDATION_MESSAGES } from '@/modules/manager/constants/manager-analytics.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import { getAdminAnalytics } from '@test/support/admin-analytics';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { resetTestData, seedServiceArea } from '@test/support/database';
import { createManager } from '@test/support/manager';

const DAYS_KEY: Record<string, string> = {
  business: 'revenueByDay',
  delivery: 'onTimeByDay',
  users: 'newClientsByDay',
  support: 'firstResponseByDay',
  service: 'serverErrorsByDay',
};
const ROUTES = Object.keys(DAYS_KEY);
const BAD_PERIODS: [Record<string, string>, string][] = [
  [{ from: '2026-10-05', to: '2026-10-01' }, LIST_VALIDATION_MESSAGES.PERIOD_INVALID],
  [{ from: '2026-01-01', to: '2026-04-03' }, ANALYTICS_VALIDATION_MESSAGES.PERIOD_TOO_LONG],
  [{ from: '01.10.2026' }, LIST_VALIDATION_MESSAGES.DATE_INVALID],
];

describe('Admin analytics access and period (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let sessions: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    await seedServiceArea(db);
    admin = await createAdmin(app, db);
    sessions = {
      [ROLE.CLIENT]: (await registerUser(app)).cookies,
      [ROLE.COURIER]: await createCourier(app, db),
      [ROLE.MANAGER]: await createManager(app, db),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(ROUTES)('should keep everyone but the admin out of %s', async (route) => {
    for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER]) {
      await getAdminAnalytics(app, sessions[role], route).expect(HttpStatus.FORBIDDEN);
    }

    await getAdminAnalytics(app, null, route).expect(HttpStatus.UNAUTHORIZED);
  });

  it.each(ROUTES)('should give an empty period with zeros for %s', async (route) => {
    const { body } = await getAdminAnalytics(app, admin, route, {
      from: '2026-10-01',
      to: '2026-10-02',
    }).expect(HttpStatus.OK);

    expect(body.period).toEqual({ from: '2026-10-01', to: '2026-10-02' });
    expect(body[DAYS_KEY[route]]).toHaveLength(2);
  });

  it.each(ROUTES)(
    'should refuse a bad period for %s as the manager analytics does',
    async (route) => {
      for (const [query, message] of BAD_PERIODS) {
        const response = await getAdminAnalytics(app, admin, route, query).expect(
          HttpStatus.BAD_REQUEST,
        );

        expect(response.body.errors).toEqual([{ field: 'from', message }]);
      }
    },
  );

  it('should refuse an unknown parameter', async () => {
    await getAdminAnalytics(app, admin, 'business', { zone: '1' }).expect(HttpStatus.BAD_REQUEST);
  });
});
