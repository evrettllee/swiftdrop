import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
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
const DISTANCES_KM = [12.4, 3.2, 7.98];

type HistoryBody = { items: { orderId: number }[]; nextCursor?: string | null };

function idsOf(body: HistoryBody): number[] {
  return body.items.map((item) => item.orderId);
}

describe('Courier history sort (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  let ids: number[];
  let courierId: number;
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
    ids = await placeOrders(app, client.cookies, 4);
    const session = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    ({ cookies, courierProfileId: courierId } = session);
    const now = Date.now();

    for (const [index, orderId] of ids.slice(0, DISTANCES_KM.length).entries()) {
      await assignOrder(db, orderId, courierId, ORDER_STATUS.DELIVERED);
      await db
        .update(orders)
        .set({
          ...statusChange(ORDER_STATUS.DELIVERED, new Date(now - (3 - index) * 60_000)),
          distanceKm: DISTANCES_KM[index],
        })
        .where(eq(orders.orderId, orderId));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list the oldest finished first when asked', async () => {
    const response = await get({ sort: 'finishedAt:asc' }).expect(HttpStatus.OK);

    expect(idsOf(response.body)).toEqual([ids[0], ids[1], ids[2]]);
  });

  it('should sort by the distance and walk the cursor of that sort', async () => {
    const farthest = await get({ sort: 'distanceKm:desc' }).expect(HttpStatus.OK);
    const first = await get({ sort: 'distanceKm:asc', cursor: '', limit: 2 }).expect(HttpStatus.OK);
    const next = await get({
      sort: 'distanceKm:asc',
      cursor: first.body.nextCursor,
      limit: 2,
    }).expect(HttpStatus.OK);

    expect(idsOf(farthest.body)).toEqual([ids[0], ids[2], ids[1]]);
    expect(idsOf(first.body)).toEqual([ids[1], ids[2]]);
    expect(idsOf(next.body)).toEqual([ids[0]]);
    expect(next.body.nextCursor).toBeNull();
  });

  it('should keep the pages of the distance sort with the bound of the first one', async () => {
    const first = await get({ sort: 'distanceKm:desc', page: 1, limit: 2 }).expect(HttpStatus.OK);
    await assignOrder(db, ids[3], courierId, ORDER_STATUS.DELIVERED);
    await db
      .update(orders)
      .set({ ...statusChange(ORDER_STATUS.DELIVERED, new Date()), distanceKm: 99 })
      .where(eq(orders.orderId, ids[3]));

    const second = await get({
      sort: 'distanceKm:desc',
      page: 2,
      limit: 2,
      until: first.body.until,
    }).expect(HttpStatus.OK);

    expect(idsOf(first.body)).toEqual([ids[0], ids[2]]);
    expect(idsOf(second.body)).toEqual([ids[1]]);
    expect(second.body.total).toBe(3);
  });
});
