import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { MS_PER_DAY } from '@/common/constants/time.constants';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_ORDERS_ROUTES,
  COURIER_STATS_ROUTES,
} from '@/modules/deliveries/constants/deliveries.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP, ROUTE, SMALL_PACKAGE } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { statusChange } from '@test/support/order-status';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const HISTORY_PATH = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.HISTORY}`;
const TODAY_PATH = `${COURIER_STATS_ROUTES.BASE}/${COURIER_STATS_ROUTES.TODAY}`;
// Far enough back to be another day in any time zone.
const TWO_DAYS_MS = 2 * MS_PER_DAY;
const HOUR_MS = MS_PER_DAY / 24;

describe('Courier history and today stats (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  let courierId: number;
  let deliveredId: number;
  let cancelledId: number;
  let activeId: number;
  const getRoute = jest.fn();

  function get(path: string, query: Record<string, string | number> = {}) {
    return getApi(app, path).set(COOKIE_HEADER, cookies).query(query);
  }

  // Ends the order with the courier and writes the final status to its history at that moment.
  async function finish(orderId: number, status: OrderStatus, at: Date = new Date()) {
    await assignOrder(db, orderId, courierId, status);
    await db.update(orders).set(statusChange(status, at)).where(eq(orders.orderId, orderId));
    await db.insert(orderStatusHistory).values({ orderId, status, changedBy: null, changedAt: at });
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    [deliveredId, cancelledId, activeId] = await placeOrders(app, client.cookies, 3);
    ({ courierProfileId: courierId, cookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list the finished orders the last finished first and leave out the active one', async () => {
    await finish(cancelledId, ORDER_STATUS.CANCELLED, new Date(Date.now() - HOUR_MS));
    await finish(deliveredId, ORDER_STATUS.DELIVERED);
    await assignOrder(db, activeId, courierId, ORDER_STATUS.IN_TRANSIT);

    const response = await get(HISTORY_PATH).expect(HttpStatus.OK);

    expect(response.body.total).toBe(2);
    expect(response.body.items.map((item: { orderId: number }) => item.orderId)).toEqual([
      deliveredId,
      cancelledId,
    ]);
    expect(response.body.items[0]).toMatchObject({
      status: ORDER_STATUS.DELIVERED,
      finishedAt: expect.any(String),
      distanceKm: ROUTE.distanceKm,
      weightKg: SMALL_PACKAGE.weightKg,
    });
  });

  it('should return the requested page of the history', async () => {
    await finish(cancelledId, ORDER_STATUS.CANCELLED, new Date(Date.now() - HOUR_MS));
    await finish(deliveredId, ORDER_STATUS.DELIVERED);

    const response = await get(HISTORY_PATH, { page: 2, limit: 1 }).expect(HttpStatus.OK);

    expect(response.body.items.map((item: { orderId: number }) => item.orderId)).toEqual([
      cancelledId,
    ]);
  });

  it('should refuse the request when the page size is too big', async () => {
    await get(HISTORY_PATH, { limit: 1000 }).expect(HttpStatus.BAD_REQUEST);
  });

  it('should count today deliveries, distance and offers', async () => {
    await finish(deliveredId, ORDER_STATUS.DELIVERED);
    await insertOffer(db, deliveredId, courierId, { status: ORDER_OFFER_STATUS.ACCEPTED });
    await insertOffer(db, cancelledId, courierId, { status: ORDER_OFFER_STATUS.DECLINED });

    const response = await get(TODAY_PATH).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      delivered: 1,
      distanceKm: ROUTE.distanceKm,
      offersReceived: 2,
      offersAccepted: 1,
      rating: null,
    });
  });

  it('should not count a delivery of another day', async () => {
    await finish(deliveredId, ORDER_STATUS.DELIVERED, new Date(Date.now() - TWO_DAYS_MS));

    const response = await get(TODAY_PATH).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({ delivered: 0, distanceKm: 0 });
  });
});
