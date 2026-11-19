import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { ANALYTICS_EXPORT_MESSAGES as MESSAGES } from '@/modules/manager/constants/analytics-export.constants';
import { MANAGER_EXPORT_MESSAGES } from '@/modules/manager/constants/manager-export.constants';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import { getAnalyticsExport } from '@test/support/analytics-export';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { resetTestData, seedServiceArea } from '@test/support/database';
import { createManager } from '@test/support/manager';

const ROLES = ['admin', 'manager'] as const;

const BAD_QUERIES: [Record<string, string>, string, string][] = [
  [{ format: 'xlsx' }, 'sections', MESSAGES.NO_SECTION],
  [{ format: 'xlsx', sections: ' , ' }, 'sections', MESSAGES.NO_SECTION],
  [{ format: 'xlsx', sections: 'days,orders' }, 'sections', MESSAGES.UNKNOWN_SECTION],
  [{ format: 'csv', sections: 'days,zones' }, 'sections', MESSAGES.CSV_ONE_TABLE],
  [{ format: 'csv', sections: 'summary' }, 'sections', MESSAGES.CSV_NO_SUMMARY],
  [{ format: 'pdf', sections: 'days' }, 'format', MANAGER_EXPORT_MESSAGES.FORMAT_INVALID],
];

describe('Analytics export errors and access (e2e)', () => {
  let app: NestExpressApplication;
  let sessions: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    const db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    await seedServiceArea(db);
    sessions = {
      [ROLE.ADMIN]: await createAdmin(app, db),
      [ROLE.MANAGER]: await createManager(app, db),
      [ROLE.CLIENT]: (await registerUser(app)).cookies,
      [ROLE.COURIER]: await createCourier(app, db),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  function errorsOf(response: { body: unknown }) {
    const text = Buffer.isBuffer(response.body) ? response.body.toString('utf8') : '{}';

    return (JSON.parse(text) as { errors?: unknown }).errors;
  }

  it.each(ROLES)('should refuse every bad section rule for the %s export', async (role) => {
    for (const [query, field, message] of BAD_QUERIES) {
      const response = await getAnalyticsExport(app, sessions[role], role, {
        ...PERIOD,
        ...query,
      }).expect(HttpStatus.BAD_REQUEST);

      expect(errorsOf(response)).toEqual([{ field, message }]);
    }
  });

  it('should refuse a section of the other role', async () => {
    const admin = await getAnalyticsExport(app, sessions[ROLE.ADMIN], 'admin', {
      format: 'xlsx',
      sections: 'hours',
    }).expect(HttpStatus.BAD_REQUEST);
    const manager = await getAnalyticsExport(app, sessions[ROLE.MANAGER], 'manager', {
      format: 'xlsx',
      sections: 'failures',
    }).expect(HttpStatus.BAD_REQUEST);

    expect(errorsOf(admin)).toEqual([{ field: 'sections', message: MESSAGES.UNKNOWN_SECTION }]);
    expect(errorsOf(manager)).toEqual([{ field: 'sections', message: MESSAGES.UNKNOWN_SECTION }]);
  });

  it('should let only the admin download the admin export', async () => {
    const query = { format: 'xlsx', sections: 'zones' };

    for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER]) {
      await getAnalyticsExport(app, sessions[role], 'admin', query).expect(HttpStatus.FORBIDDEN);
    }

    await getAnalyticsExport(app, null, 'admin', query).expect(HttpStatus.UNAUTHORIZED);
    await getAnalyticsExport(app, sessions[ROLE.ADMIN], 'admin', query).expect(HttpStatus.OK);
  });

  it('should let only the manager download the manager export', async () => {
    const query = { format: 'xlsx', sections: 'zones' };

    for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.ADMIN]) {
      await getAnalyticsExport(app, sessions[role], 'manager', query).expect(HttpStatus.FORBIDDEN);
    }

    await getAnalyticsExport(app, null, 'manager', query).expect(HttpStatus.UNAUTHORIZED);
    await getAnalyticsExport(app, sessions[ROLE.MANAGER], 'manager', query).expect(HttpStatus.OK);
  });
});
