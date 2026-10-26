import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderStatusHistory, users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CANCELLABLE_STATUSES } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { cancelOrder, placeOrders, readOrderStatus, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Order cancellation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel the order and write the history record when the order is pending', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await cancelOrder(app, cookies, orderId).expect(HttpStatus.OK);

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
      await setOrderStatus(db, orderId, status);

      await cancelOrder(app, cookies, orderId).expect(HttpStatus.OK);

      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    },
  );

  it('should return 409 and keep one cancellation record when the order is cancelled twice', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    await cancelOrder(app, cookies, orderId).expect(HttpStatus.OK);

    await cancelOrder(app, cookies, orderId).expect(HttpStatus.CONFLICT);

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId));
    expect(history.filter((entry) => entry.status === ORDER_STATUS.CANCELLED)).toHaveLength(1);
  });
});
