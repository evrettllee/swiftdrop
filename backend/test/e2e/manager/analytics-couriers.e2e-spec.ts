import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { MANAGER_ANALYTICS_ROUTES } from '@/modules/manager/constants/manager-analytics.constants';
import {
  ANALYTICS_PERIOD_QUERY,
  type AnalyticsCouriers,
  getAnalytics,
  seedAnalytics,
} from '@test/support/analytics';
import { createTestApp } from '@test/support/app';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';

const { COURIERS } = MANAGER_ANALYTICS_ROUTES;

describe('Manager analytics of couriers (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let couriers: AnalyticsCouriers;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    manager = await createManager(app, db);
    couriers = await seedAnalytics(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list the couriers with work in the period and their indicators', async () => {
    const { body } = await getAnalytics(app, manager, COURIERS, ANALYTICS_PERIOD_QUERY).expect(
      HttpStatus.OK,
    );

    expect(body).toEqual({
      items: [
        {
          courierId: couriers.first,
          name: 'Дмитрий Соколов',
          vehicleType: 'car',
          delivered: 2,
          onTimePct: 50,
          avgDeliveryMin: 39,
          declinedOffers: 1,
          hoursOnline: 3.5,
        },
        {
          courierId: couriers.second,
          name: 'Олег Новик',
          vehicleType: null,
          delivered: 0,
          onTimePct: null,
          avgDeliveryMin: null,
          declinedOffers: 0,
          hoursOnline: 0.5,
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
      period: { from: '2026-10-01', to: '2026-10-07' },
    });
  });

  it.each([
    ['hoursOnline:asc', 'second'],
    ['onTimePct:asc', 'first'],
    ['name:desc', 'second'],
  ] as const)('should sort the couriers by %s', async (sort, first) => {
    const { body } = await getAnalytics(app, manager, COURIERS, {
      ...ANALYTICS_PERIOD_QUERY,
      sort,
    }).expect(HttpStatus.OK);

    expect(body.items[0].courierId).toBe(couriers[first]);
  });

  it('should give the next page of the couriers', async () => {
    const { body } = await getAnalytics(app, manager, COURIERS, {
      ...ANALYTICS_PERIOD_QUERY,
      limit: 1,
      page: 2,
    }).expect(HttpStatus.OK);

    expect(body.items.map((item: { courierId: number }) => item.courierId)).toEqual([
      couriers.second,
    ]);
    expect(body.total).toBe(2);
  });
});
