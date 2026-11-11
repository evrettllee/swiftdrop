import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import {
  createManager,
  getManagerOrders,
  idsOf,
  type ManagerListBody,
} from '@test/support/manager';
import { placeOrders, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Manager orders list (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let firstIds: number[];
  let secondIds: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const first = await registerUser(app);
    const second = await registerUser(app, SECOND_CLIENT);
    firstIds = await placeOrders(app, first.cookies, 3);
    secondIds = await placeOrders(app, second.cookies, 2);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function list(query: Record<string, string | number> = {}): Promise<ManagerListBody> {
    const response = await getManagerOrders(app, manager, query).expect(HttpStatus.OK);

    return response.body as ManagerListBody;
  }

  it('should refuse a client and a courier', async () => {
    const client = await registerUser(app, {
      ...SECOND_CLIENT,
      email: 'c@example.com',
      phone: '+375291112233',
    });
    const courier = await createCourier(app, db);

    await getManagerOrders(app, client.cookies).expect(HttpStatus.FORBIDDEN);
    await getManagerOrders(app, courier).expect(HttpStatus.FORBIDDEN);
  });

  it('should list every order, newest first, with the bound of the list', async () => {
    const body = await list();

    expect(idsOf(body)).toEqual([...firstIds, ...secondIds].reverse());
    expect(body).toMatchObject({ total: 5, page: 1, limit: 20, until: Math.max(...secondIds) });
  });

  it('should leave out orders placed after the bound', async () => {
    const { until } = await list();
    const second = await registerUser(app, {
      ...SECOND_CLIENT,
      email: 'late@example.com',
      phone: '+375291110000',
    });
    await placeOrders(app, second.cookies, 1);

    const body = await list({ until: until ?? 0 });

    expect(body.total).toBe(5);
  });

  it('should filter by the groups of statuses', async () => {
    await setOrderStatus(db, firstIds[0], ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await setOrderStatus(db, firstIds[1], ORDER_STATUS.DELIVERED);
    await setOrderStatus(db, firstIds[2], ORDER_STATUS.REJECTED);

    expect(idsOf(await list({ status: 'attention' }))).toEqual([firstIds[0]]);
    expect(idsOf(await list({ status: 'finished,cancelled' }))).toEqual([firstIds[2], firstIds[1]]);
    expect(idsOf(await list({ status: 'awaiting_payment' }))).toEqual([...secondIds].reverse());
  });

  it('should sort the attention tab by the time it has waited, the longest first', async () => {
    await setOrderStatus(db, firstIds[2], ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await setOrderStatus(db, firstIds[0], ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await db
      .update(orders)
      .set({ statusChangedAt: new Date(Date.now() - 60_000) })
      .where(eq(orders.orderId, firstIds[2]));

    const body = await list({ status: 'attention', sort: 'statusChangedAt:asc' });

    expect(idsOf(body)).toEqual([firstIds[2], firstIds[0]]);
  });

  it('should walk the list by cursor without repeats and give the total once', async () => {
    const first = await list({ cursor: '', limit: 2 });
    const second = await list({ cursor: first.nextCursor ?? '', limit: 2 });
    const third = await list({ cursor: second.nextCursor ?? '', limit: 2 });

    expect(first.total).toBe(5);
    expect(second).not.toHaveProperty('total');
    expect([...idsOf(first), ...idsOf(second), ...idsOf(third)]).toEqual(
      [...firstIds, ...secondIds].reverse(),
    );
    expect(third.nextCursor).toBeNull();
  });

  it.each([
    [{ status: 'delivered' }],
    [{ payment: 'pending' }],
    [{ fragile: 'false' }],
    [{ sort: 'email:asc' }],
    [{ page: 1, cursor: '' }],
    [{ unknown: 'x' }],
  ])('should refuse %j with 400', async (query) => {
    await getManagerOrders(app, manager, query).expect(HttpStatus.BAD_REQUEST);
  });
});
