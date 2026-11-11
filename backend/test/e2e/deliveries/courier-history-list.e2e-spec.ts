import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { MS_PER_DAY } from '@/common/constants/time.constants';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
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
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP, ROUTE } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { statusChange } from '@test/support/order-status';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const HISTORY_PATH = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.HISTORY}`;
const TEN_DAYS_MS = 10 * MS_PER_DAY;

type HistoryBody = {
  items: { orderId: number }[];
  total?: number;
  nextCursor?: string | null;
  summary?: { count: number; distanceKm: number };
};

function idsOf(body: HistoryBody): number[] {
  return body.items.map((item) => item.orderId);
}

function km(value: number): number {
  return Math.round(value * 10) / 10;
}

function minskDay(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Minsk' });
}

describe('Courier history search, period and summary (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  let courierId: number;
  let ids: number[];
  const getRoute = jest.fn();

  function get(query: Record<string, string | number> = {}, as = cookies) {
    return getApi(app, HISTORY_PATH).set(COOKIE_HEADER, as).query(query);
  }

  async function finish(orderId: number, status: OrderStatus, at: Date, courier = courierId) {
    await assignOrder(db, orderId, courier, status);
    await db.update(orders).set(statusChange(status, at)).where(eq(orders.orderId, orderId));
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    ids = await placeOrders(app, client.cookies, 4);
    ({ courierProfileId: courierId, cookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    const now = Date.now();
    await finish(ids[0], ORDER_STATUS.DELIVERED, new Date(now - TEN_DAYS_MS));
    await finish(ids[1], ORDER_STATUS.CANCELLED, new Date(now - 2 * 60_000));
    await finish(ids[2], ORDER_STATUS.DELIVERED, new Date(now - 60_000));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sum only the delivered orders of the whole history', async () => {
    const response = await get().expect(HttpStatus.OK);

    expect(idsOf(response.body)).toEqual([ids[2], ids[1], ids[0]]);
    expect(response.body.total).toBe(3);
    expect(response.body.limit).toBe(20);
    expect(response.body.summary).toEqual({ count: 2, distanceKm: km(2 * ROUTE.distanceKm) });
  });

  it('should keep the summary to the period by the finish time', async () => {
    const today = minskDay(new Date());

    const response = await get({ from: today, to: today }).expect(HttpStatus.OK);

    expect(idsOf(response.body)).toEqual([ids[2], ids[1]]);
    expect(response.body.summary).toEqual({ count: 1, distanceKm: km(ROUTE.distanceKm) });
  });

  it('should find an order by its number only', async () => {
    const found = await get({ q: String(ids[0]) }).expect(HttpStatus.OK);
    const cancelled = await get({ q: String(ids[1]) }).expect(HttpStatus.OK);
    const active = await get({ q: String(ids[3]) }).expect(HttpStatus.OK);

    expect(idsOf(found.body)).toEqual([ids[0]]);
    expect(found.body.summary).toEqual({ count: 1, distanceKm: km(ROUTE.distanceKm) });
    expect(idsOf(cancelled.body)).toEqual([ids[1]]);
    expect(cancelled.body.summary).toEqual({ count: 0, distanceKm: 0 });
    expect(active.body).toMatchObject({ items: [], total: 0 });
  });

  it('should refuse a search by anything but the number', async () => {
    const response = await get({ q: 'Немига' }).expect(HttpStatus.BAD_REQUEST);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: HISTORY_VALIDATION_MESSAGES.SEARCH_NOT_NUMBER }),
      ]),
    );
  });

  it('should not show nor count the orders of another courier', async () => {
    const other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await finish(ids[3], ORDER_STATUS.DELIVERED, new Date(), other.courierProfileId);

    const own = await get().expect(HttpStatus.OK);
    const foreign = await get({ q: String(ids[3]) }).expect(HttpStatus.OK);
    const theirs = await get({}, other.cookies).expect(HttpStatus.OK);

    expect(idsOf(own.body)).not.toContain(ids[3]);
    expect(own.body.summary).toEqual({ count: 2, distanceKm: km(2 * ROUTE.distanceKm) });
    expect(foreign.body).toMatchObject({ items: [], total: 0 });
    expect(theirs.body.summary).toEqual({ count: 1, distanceKm: km(ROUTE.distanceKm) });
  });

  it('should walk the cursor by the finish time and sum only on the first page', async () => {
    const first = await get({ cursor: '', limit: 2 }).expect(HttpStatus.OK);
    const next = await get({ cursor: first.body.nextCursor, limit: 2 }).expect(HttpStatus.OK);

    expect(idsOf(first.body)).toEqual([ids[2], ids[1]]);
    expect(first.body.summary).toEqual({ count: 2, distanceKm: km(2 * ROUTE.distanceKm) });
    expect(idsOf(next.body)).toEqual([ids[0]]);
    expect(next.body).not.toHaveProperty('summary');
    expect(next.body.nextCursor).toBeNull();
  });

  it('should keep the pages in place with the bound of the first one', async () => {
    const first = await get({ page: 1, limit: 2 }).expect(HttpStatus.OK);
    await finish(ids[3], ORDER_STATUS.DELIVERED, new Date());

    const second = await get({ page: 2, limit: 2, until: first.body.until }).expect(HttpStatus.OK);

    expect(idsOf(second.body)).toEqual([ids[0]]);
    expect(second.body.total).toBe(3);
  });
});
