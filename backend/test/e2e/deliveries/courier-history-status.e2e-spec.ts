import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_ORDERS_ROUTES,
  HISTORY_VALIDATION_MESSAGES,
} from '@/modules/deliveries/constants/deliveries.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { statusChange } from '@test/support/order-status';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const HISTORY_PATH = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.HISTORY}`;
const FINISHED = [
  { status: ORDER_STATUS.DELIVERED, distanceKm: 4.5 },
  { status: ORDER_STATUS.CANCELLED, distanceKm: 6 },
  { status: ORDER_STATUS.DELIVERED, distanceKm: 2.5 },
] as const;

type HistoryBody = {
  items: { orderId: number; status: string }[];
  total: number;
  summary: { count: number; distanceKm: number };
};

describe('Courier history status (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  let ids: number[];
  const getRoute = jest.fn();

  function get(query: Record<string, string | number> = {}) {
    return getApi(app, HISTORY_PATH).set(COOKIE_HEADER, cookies).query(query);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    ids = await placeOrders(app, client.cookies, FINISHED.length);
    const session = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    cookies = session.cookies;
    const now = Date.now();

    for (const [index, orderId] of ids.entries()) {
      const { status, distanceKm } = FINISHED[index];
      await assignOrder(db, orderId, session.courierProfileId, status);
      await db
        .update(orders)
        .set({ ...statusChange(status, new Date(now - (3 - index) * 60_000)), distanceKm })
        .where(eq(orders.orderId, orderId));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list every finished order without a status', async () => {
    const body = (await get().expect(HttpStatus.OK)).body as HistoryBody;

    expect(body.total).toBe(3);
    expect(body.summary).toEqual({ count: 2, distanceKm: 7 });
  });

  it('should keep to the cancelled orders and count them in the total', async () => {
    const body = (await get({ status: 'cancelled' }).expect(HttpStatus.OK)).body as HistoryBody;

    expect(body.items.map((item) => item.orderId)).toEqual([ids[1]]);
    expect(body.total).toBe(1);
    expect(body.summary).toEqual({ count: 2, distanceKm: 7 });
  });

  it('should keep to the delivered orders in the feed as well', async () => {
    const body = (await get({ status: 'delivered', cursor: '' }).expect(HttpStatus.OK))
      .body as HistoryBody;

    expect(body.items.map((item) => item.orderId)).toEqual([ids[2], ids[0]]);
    expect(body.total).toBe(2);
    expect(body.summary).toEqual({ count: 2, distanceKm: 7 });
  });

  it.each(['pending', 'delivered,cancelled'])('should refuse the status %s', async (status) => {
    const response = await get({ status }).expect(HttpStatus.BAD_REQUEST);

    expect(JSON.stringify(response.body)).toContain(HISTORY_VALIDATION_MESSAGES.STATUS_INVALID);
  });
});
