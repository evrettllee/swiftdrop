import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  MANAGER_ANALYTICS_ROUTES,
  MANAGER_ANALYTICS_THROTTLE,
} from '@/modules/manager/constants/manager-analytics.constants';
import { MANAGER_EXPORT_THROTTLE } from '@/modules/manager/constants/manager-export.constants';
import { getAnalytics } from '@test/support/analytics';
import { createTestApp } from '@test/support/app';
import { createManager, getManagerExport } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

const BAD_ANALYTICS_QUERY = { sort: 'nope' };

describe('Manager export and analytics limits per user (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let admin: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    manager = await createManager(app, db);
    admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should take 10 exports a minute from one user and not count them for another', async () => {
    for (let index = 0; index < MANAGER_EXPORT_THROTTLE.LIMIT; index += 1) {
      await getManagerExport(app, manager, {}).expect(HttpStatus.BAD_REQUEST);
    }

    await getManagerExport(app, manager, {}).expect(HttpStatus.TOO_MANY_REQUESTS);
    await getManagerExport(app, admin, {}).expect(HttpStatus.BAD_REQUEST);
  });

  it('should take 30 analytics requests a minute from one user across both reports', async () => {
    const { SUMMARY, COURIERS } = MANAGER_ANALYTICS_ROUTES;

    for (let index = 0; index < MANAGER_ANALYTICS_THROTTLE.LIMIT; index += 1) {
      const route = index % 2 === 0 ? SUMMARY : COURIERS;

      await getAnalytics(app, manager, route, BAD_ANALYTICS_QUERY).expect(HttpStatus.BAD_REQUEST);
    }

    await getAnalytics(app, manager, COURIERS).expect(HttpStatus.TOO_MANY_REQUESTS);
    await getAnalytics(app, admin, SUMMARY).expect(HttpStatus.OK);
  });
});
