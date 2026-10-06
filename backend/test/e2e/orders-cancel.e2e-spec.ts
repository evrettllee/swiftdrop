import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import { ORDER_STATUS, type OrderStatus } from '../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { orders, orderStatusHistory, users } from '../../src/db/schema';
import { OsrmService } from '../../src/integrations/osrm/osrm.service';
import {
  CANCELLABLE_STATUSES,
  FINISHED_STATUSES,
  ORDERS_ERROR_MESSAGES,
  ORDERS_ROUTES,
  ORDERS_VALIDATION_MESSAGES,
} from '../../src/orders/orders.constants';
import { createTestApp } from '../support/app';
import { registerUser } from '../support/auth';
import { resetTestData, seedServiceArea } from '../support/database';
import { ROUTE } from '../support/fixtures';
import { postApi } from '../support/http';
import { type Cookies, placeOrders, SECOND_CLIENT } from '../support/orders';

const MISSING_ORDER_ID = 999_999;
const PICKED_UP_STATUSES = [ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT];

describe('Order cancellation (e2e)', () => {
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

  function cancelOrder(cookies: Cookies, orderId: number | string) {
    const path = `${ORDERS_ROUTES.BASE}/${ORDERS_ROUTES.CANCEL.replace(':orderId', String(orderId))}`;

    return postApi(app, path).set('Cookie', cookies);
  }

  async function setStatus(orderId: number, status: OrderStatus): Promise<void> {
    await db.update(orders).set({ status }).where(eq(orders.orderId, orderId));
  }

  async function readStatus(orderId: number): Promise<OrderStatus> {
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.orderId, orderId));

    return order.status;
  }

  it('should cancel the order and write the history record when the order is pending', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await cancelOrder(cookies, orderId).expect(200);

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.statusHistoryId));
    const [client] = await db.select({ userId: users.userId }).from(users);

    expect(response.body).toEqual({ orderId, status: ORDER_STATUS.CANCELLED });
    expect(history.map((entry) => entry.status)).toEqual([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CANCELLED,
    ]);
    expect(history[1].changedBy).toBe(client.userId);
  });

  it.each([...CANCELLABLE_STATUSES])(
    'should cancel the order when its status is %s',
    async (status) => {
      const { cookies } = await registerUser(app);
      const [orderId] = await placeOrders(app, cookies, 1);
      await setStatus(orderId, status);

      await cancelOrder(cookies, orderId).expect(200);

      expect(await readStatus(orderId)).toBe(ORDER_STATUS.CANCELLED);
    },
  );

  it.each(PICKED_UP_STATUSES)(
    'should return 409 and keep the status when the courier already took the package and the status is %s',
    async (status) => {
      const { cookies } = await registerUser(app);
      const [orderId] = await placeOrders(app, cookies, 1);
      await setStatus(orderId, status);

      const response = await cancelOrder(cookies, orderId).expect(409);

      expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.CANNOT_CANCEL);
      expect(await readStatus(orderId)).toBe(status);
    },
  );

  it.each([...FINISHED_STATUSES])(
    'should return 409 with the finished message when the order status is %s',
    async (status) => {
      const { cookies } = await registerUser(app);
      const [orderId] = await placeOrders(app, cookies, 1);
      await setStatus(orderId, status);

      const response = await cancelOrder(cookies, orderId).expect(409);

      expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.ALREADY_FINISHED);
    },
  );

  it('should return 409 and keep one cancellation record when the order is cancelled twice', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    await cancelOrder(cookies, orderId).expect(200);

    await cancelOrder(cookies, orderId).expect(409);

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId));
    expect(history.filter((entry) => entry.status === ORDER_STATUS.CANCELLED)).toHaveLength(1);
  });

  it('should return 404 and keep the order when it belongs to another client', async () => {
    const { cookies } = await registerUser(app);
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await cancelOrder(otherCookies, orderId).expect(404);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
    expect(await readStatus(orderId)).toBe(ORDER_STATUS.PENDING);
  });

  it('should return 404 when the order does not exist', async () => {
    const { cookies } = await registerUser(app);

    const response = await cancelOrder(cookies, MISSING_ORDER_ID).expect(404);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
  });

  it('should return 400 with a field error when the order id is not a number', async () => {
    const { cookies } = await registerUser(app);

    const response = await cancelOrder(cookies, 'abc').expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'orderId',
          message: ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID,
        }),
      ]),
    );
  });

  it('should return 401 when the request has no authentication', async () => {
    const path = `${ORDERS_ROUTES.BASE}/${ORDERS_ROUTES.CANCEL.replace(':orderId', '1')}`;

    await postApi(app, path).expect(401);
  });
});
