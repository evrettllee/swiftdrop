import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  ORDER_LIST_FILTER,
  ORDERS_FIRST_PAGE,
  ORDERS_PAGE_SIZE_DEFAULT,
} from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { getOrders, placeOrders, SECOND_CLIENT } from '../../support/orders';

type ListBody = { items: { orderId: number }[] };

function idsOf(body: ListBody): number[] {
  return body.items.map((item) => item.orderId);
}

describe('Orders list (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return an empty first page when the client has no orders', async () => {
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies).expect(200);

    expect(response.body).toEqual({
      items: [],
      total: 0,
      page: ORDERS_FIRST_PAGE,
      limit: ORDERS_PAGE_SIZE_DEFAULT,
    });
  });

  it('should return only the orders of the current client when other clients have orders', async () => {
    const { cookies } = await registerUser(app);
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);
    const ownIds = await placeOrders(app, cookies, 2);
    await placeOrders(app, otherCookies, 1);

    const response = await getOrders(app, cookies).expect(200);

    expect(response.body.total).toBe(2);
    expect(idsOf(response.body)).toEqual([...ownIds].reverse());
  });

  it('should return the newest order first when the client has several orders', async () => {
    const { cookies } = await registerUser(app);
    const ids = await placeOrders(app, cookies, 3);

    const response = await getOrders(app, cookies).expect(200);

    expect(idsOf(response.body)).toEqual([...ids].reverse());
  });

  it('should return the requested page and the total when the page size is smaller than the count', async () => {
    const { cookies } = await registerUser(app);
    const ids = await placeOrders(app, cookies, 3);

    const response = await getOrders(app, cookies, { page: 2, limit: 2 }).expect(200);

    expect(response.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(idsOf(response.body)).toEqual([ids[0]]);
  });

  it('should split orders into active and finished when a filter is given', async () => {
    const { cookies } = await registerUser(app);
    const [finishedId, activeId] = await placeOrders(app, cookies, 2);
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.DELIVERED })
      .where(eq(orders.orderId, finishedId));

    const finished = await getOrders(app, cookies, { filter: ORDER_LIST_FILTER.FINISHED }).expect(
      200,
    );
    const active = await getOrders(app, cookies, { filter: ORDER_LIST_FILTER.ACTIVE }).expect(200);

    expect(idsOf(finished.body)).toEqual([finishedId]);
    expect(idsOf(active.body)).toEqual([activeId]);
  });

  it('should return the status, the price and both addresses when an order is listed', async () => {
    const { cookies } = await registerUser(app);
    await placeOrders(app, cookies, 1);

    const response = await getOrders(app, cookies).expect(200);

    expect(response.body.items[0]).toMatchObject({
      status: ORDER_STATUS.PENDING,
      price: 9.23,
      currency: 'BYN',
      pickup: { city: 'Минск', street: 'ул. Свердлова', house: '13а', apartment: null },
      delivery: { city: 'Минск', street: 'пр-т Притыцкого', house: '83', apartment: '47' },
    });
  });
});
