import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { buildOrders, getAdminAnalytics } from '@test/support/admin-analytics';
import { deliveryPlans } from '@test/support/admin-analytics-delivery-plans';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import { findTariffId, insertZone, zoneIdOf } from '@test/support/admin-tariffs';
import { registerUser, validRegistration } from '@test/support/auth';
import { TEST_ZONE_NAME } from '@test/support/constants';
import {
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
} from '@test/support/couriers';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import { MANAGER_ACCOUNT } from '@test/support/users';

describe('Admin analytics delivery (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let eastZoneId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    eastZoneId = await insertZone(db, await findTariffId(db), 'Восток');
    const client = await registerUser(app);
    await getCourierMe(app, await createCourier(app, db)).expect(HttpStatus.OK);
    await createManager(app, db);
    const actors = {
      client: await findUserId(db, validRegistration.email),
      courier: await findUserId(db, COURIER_ACCOUNT.email),
      courierProfile: await findCourierProfileId(db, COURIER_ACCOUNT.email),
      manager: await findUserId(db, MANAGER_ACCOUNT.email),
    };
    await buildOrders(
      app,
      db,
      client.cookies,
      actors,
      deliveryPlans(await zoneIdOf(db, TEST_ZONE_NAME), eastZoneId),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function delivery() {
    const response = await getAdminAnalytics(app, admin, 'delivery', PERIOD).expect(HttpStatus.OK);

    return response.body;
  }

  it('should count on time against the promise and leave out orders without one', async () => {
    const body = await delivery();

    expect(body.kpis).toEqual({
      onTimeRate: { value: { onTime: 2, total: 3 }, previous: { onTime: 0, total: 1 } },
      averageDeliveryMinutes: { value: 55, previous: 120 },
      autoAssignedRate: { value: { auto: 3, manual: 1 }, previous: { auto: 1, manual: 0 } },
      averageSearchSeconds: { value: 525, previous: 60 },
    });
    expect(body.onTimeByDay).toEqual([
      { date: '2026-10-01', onTime: 1, total: 1 },
      { date: '2026-10-02', onTime: 0, total: 1 },
      { date: '2026-10-03', onTime: 0, total: 0 },
      { date: '2026-10-04', onTime: 1, total: 1 },
      { date: '2026-10-05', onTime: 0, total: 0 },
      { date: '2026-10-06', onTime: 0, total: 0 },
      { date: '2026-10-07', onTime: 0, total: 0 },
    ]);
  });

  it('should count the offers made in the period', async () => {
    const body = await delivery();

    expect(body.offers).toEqual({
      accepted: 3,
      declined: 2,
      expired: 1,
      total: 6,
      orders: 4,
      maxDeclinesBeforeManual: 5,
    });
  });

  it('should split the orders by the zone of the pickup and put orders without a zone last', async () => {
    const body = await delivery();

    expect(body.zones).toEqual([
      {
        zoneId: expect.any(Number),
        name: TEST_ZONE_NAME,
        orders: 2,
        onTime: 1,
        onTimeTotal: 2,
        averageDeliveryMinutes: 65,
        manualAssigned: 1,
        revenue: 20,
      },
      {
        zoneId: eastZoneId,
        name: 'Восток',
        orders: 1,
        onTime: 1,
        onTimeTotal: 1,
        averageDeliveryMinutes: 60,
        manualAssigned: 0,
        revenue: 10,
      },
      {
        zoneId: null,
        name: 'Без зоны',
        orders: 1,
        onTime: 0,
        onTimeTotal: 0,
        averageDeliveryMinutes: 30,
        manualAssigned: 0,
        revenue: 10,
      },
    ]);
  });
});
