import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { MANAGER_ANALYTICS_ROUTES } from '@/modules/manager/constants/manager-analytics.constants';
import { ANALYTICS_PERIOD_QUERY, getAnalytics, seedAnalytics } from '@test/support/analytics';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createManager } from '@test/support/manager';
import { SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

const { SUMMARY, COURIERS } = MANAGER_ANALYTICS_ROUTES;

describe('Manager analytics summary (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    manager = await createManager(app, db);
    await seedAnalytics(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should let a manager and an admin in, and keep a client and a guest out', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
    const { cookies: client } = await registerUser(app, SECOND_CLIENT);

    await getAnalytics(app, admin, SUMMARY).expect(HttpStatus.OK);
    await getAnalytics(app, admin, COURIERS).expect(HttpStatus.OK);
    await getAnalytics(app, client, SUMMARY).expect(HttpStatus.FORBIDDEN);
    await getAnalytics(app, client, COURIERS).expect(HttpStatus.FORBIDDEN);
    await getAnalytics(app, null, SUMMARY).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should count the indicators of the period and of the one before it', async () => {
    const { body } = await getAnalytics(app, manager, SUMMARY, ANALYTICS_PERIOD_QUERY).expect(
      HttpStatus.OK,
    );

    expect(body.period).toEqual({
      from: '2026-10-01',
      to: '2026-10-07',
      previousFrom: '2026-09-24',
      previousTo: '2026-09-30',
    });
    expect(body.kpis).toEqual({
      delivered: { current: { delivered: 2, total: 4 }, previous: { delivered: 1, total: 1 } },
      onTime: { current: { pct: 50, count: 1 }, previous: { pct: 100, count: 1 } },
      avgDeliveryMin: { current: 39, previous: 20 },
      cancelled: {
        current: { pct: 25, count: 1, by: { client: 1, system: 0, staff: 0 } },
        previous: { pct: 0, count: 0, by: { client: 0, system: 0, staff: 0 } },
      },
      revenue: {
        current: { total: '35.75', avgCheck: '11.92', orders: 3 },
        previous: { total: '8.00', avgCheck: '8.00', orders: 1 },
      },
      courierSearch: { current: { avgMin: 5.7, manual: 1 }, previous: { avgMin: 2, manual: 0 } },
    });
  });

  it('should give every day of the period and the average orders of every hour', async () => {
    const { body } = await getAnalytics(app, manager, SUMMARY, ANALYTICS_PERIOD_QUERY).expect(
      HttpStatus.OK,
    );
    const busyHours = body.hours.filter((hour: { avgOrders: number }) => hour.avgOrders > 0);

    expect(body.days).toEqual([
      { date: '2026-10-01', delivered: 2, cancelled: 0, inProgress: 0 },
      { date: '2026-10-02', delivered: 0, cancelled: 0, inProgress: 0 },
      { date: '2026-10-03', delivered: 0, cancelled: 1, inProgress: 0 },
      { date: '2026-10-04', delivered: 0, cancelled: 0, inProgress: 0 },
      { date: '2026-10-05', delivered: 0, cancelled: 0, inProgress: 1 },
      { date: '2026-10-06', delivered: 0, cancelled: 0, inProgress: 0 },
      { date: '2026-10-07', delivered: 0, cancelled: 0, inProgress: 0 },
    ]);
    expect(body.hours).toHaveLength(24);
    expect(busyHours).toEqual([
      { hour: 9, avgOrders: 0.29 },
      { hour: 12, avgOrders: 0.14 },
      { hour: 18, avgOrders: 0.14 },
    ]);
  });

  it('should refuse a period over 92 days', async () => {
    await getAnalytics(app, manager, SUMMARY, { from: '2026-01-01', to: '2026-04-03' }).expect(
      HttpStatus.BAD_REQUEST,
    );
    await getAnalytics(app, manager, COURIERS, { sort: 'phone:asc' }).expect(
      HttpStatus.BAD_REQUEST,
    );
  });
});
