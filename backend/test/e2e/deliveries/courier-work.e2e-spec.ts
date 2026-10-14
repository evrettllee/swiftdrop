import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { MS_PER_DAY } from '../../../src/common/constants/time.constants';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS, type OrderStatus } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orderStatusHistory } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  COURIER_ORDERS_ROUTES,
  COURIER_STATS_ROUTES,
} from '../../../src/modules/deliveries/constants/deliveries.constants';
import { createTestApp } from '../../support/app';
import { addCourierSession, insertOffer } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '../../support/couriers';
import { MINSK_PICKUP, ROUTE } from '../../support/fixtures';
import { getApi } from '../../support/http';
import { placeOrders } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

const HISTORY_PATH = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.HISTORY}`;
const TODAY_PATH = `${COURIER_STATS_ROUTES.BASE}/${COURIER_STATS_ROUTES.TODAY}`;
// Far enough back to be another day in any time zone.
const TWO_DAYS_MS = 2 * MS_PER_DAY;

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

  it('should list the finished orders the newest first and leave out the active one', async () => {
    await finish(deliveredId, ORDER_STATUS.DELIVERED);
    await finish(cancelledId, ORDER_STATUS.CANCELLED);
    await assignOrder(db, activeId, courierId, ORDER_STATUS.IN_TRANSIT);

    const response = await get(HISTORY_PATH).expect(HttpStatus.OK);

    expect(response.body.total).toBe(2);
    expect(response.body.items.map((item: { orderId: number }) => item.orderId)).toEqual([
      cancelledId,
      deliveredId,
    ]);
    expect(response.body.items[1]).toMatchObject({
      status: ORDER_STATUS.DELIVERED,
      finishedAt: expect.any(String),
      distanceKm: ROUTE.distanceKm,
    });
  });

  it('should return the requested page of the history', async () => {
    await finish(deliveredId, ORDER_STATUS.DELIVERED);
    await finish(cancelledId, ORDER_STATUS.CANCELLED);

    const response = await get(HISTORY_PATH, { page: 2, limit: 1 }).expect(HttpStatus.OK);

    expect(response.body.items.map((item: { orderId: number }) => item.orderId)).toEqual([
      deliveredId,
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
