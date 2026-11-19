import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { buildOrders, getAdminAnalytics } from '@test/support/admin-analytics';
import { ANALYTICS_PERIOD as PERIOD, BUSINESS_PLANS } from '@test/support/admin-analytics-plans';
import { registerUser, validRegistration } from '@test/support/auth';
import {
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
} from '@test/support/couriers';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import { MANAGER_ACCOUNT } from '@test/support/users';

describe('Admin analytics business (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    const client = await registerUser(app);
    await getCourierMe(app, await createCourier(app, db)).expect(HttpStatus.OK);
    await createManager(app, db);
    await buildOrders(
      app,
      db,
      client.cookies,
      {
        client: await findUserId(db, validRegistration.email),
        courier: await findUserId(db, COURIER_ACCOUNT.email),
        courierProfile: await findCourierProfileId(db, COURIER_ACCOUNT.email),
        manager: await findUserId(db, MANAGER_ACCOUNT.email),
      },
      BUSINESS_PLANS,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should count the KPIs of the period and of the previous one', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'business', PERIOD).expect(HttpStatus.OK);

    expect(body.period).toEqual(PERIOD);
    expect(body.kpis).toEqual({
      ordersCreated: { value: 10, previous: 2 },
      revenue: { value: 35.5, previous: 30 },
      averageCheck: { value: 11.83, previous: 30 },
      refunds: { value: { amount: 15, orders: 1 }, previous: { amount: 0, orders: 0 } },
    });
  });

  it('should build the funnel and the losses of the orders created in the period', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'business', PERIOD).expect(HttpStatus.OK);

    expect(body.funnel).toEqual({ created: 10, paid: 7, courierAssigned: 4, delivered: 3 });
    expect(body.losses).toEqual({
      unpaidExpired: 1,
      cancelledBeforePayment: 1,
      cancelledAfterPayment: { client: 1, system: 1, staff: 1 },
      inProgress: 2,
    });
  });

  it('should give the revenue of every Minsk day with zeros', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'business', PERIOD).expect(HttpStatus.OK);

    expect(body.revenueByDay).toEqual([
      { date: '2026-10-01', revenue: 15, delivered: 2 },
      { date: '2026-10-02', revenue: 0, delivered: 0 },
      { date: '2026-10-03', revenue: 20.5, delivered: 1 },
      { date: '2026-10-04', revenue: 0, delivered: 0 },
      { date: '2026-10-05', revenue: 0, delivered: 0 },
      { date: '2026-10-06', revenue: 0, delivered: 0 },
      { date: '2026-10-07', revenue: 0, delivered: 0 },
    ]);
  });
});
