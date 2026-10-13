import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  FINISHED_STATUSES,
  ORDERS_ERROR_MESSAGES,
  ORDERS_ROUTES,
  ORDERS_VALIDATION_MESSAGES,
} from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { MISSING_ORDER_ID } from '../../support/constants';
import { postApi } from '../../support/http';
import {
  cancelOrder,
  placeOrders,
  readOrderStatus,
  SECOND_CLIENT,
  setOrderStatus,
} from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

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
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(PICKED_UP_STATUSES)(
    'should return 409 and keep the status when the courier already took the package and the status is %s',
    async (status) => {
      const { cookies } = await registerUser(app);
      const [orderId] = await placeOrders(app, cookies, 1);
      await setOrderStatus(db, orderId, status);

      const response = await cancelOrder(app, cookies, orderId).expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.CANNOT_CANCEL);
      expect(await readOrderStatus(db, orderId)).toBe(status);
    },
  );

  it.each([...FINISHED_STATUSES])(
    'should return 409 with the finished message when the order status is %s',
    async (status) => {
      const { cookies } = await registerUser(app);
      const [orderId] = await placeOrders(app, cookies, 1);
      await setOrderStatus(db, orderId, status);

      const response = await cancelOrder(app, cookies, orderId).expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.ALREADY_FINISHED);
    },
  );

  it('should return 404 and keep the order when it belongs to another client', async () => {
    const { cookies } = await registerUser(app);
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await cancelOrder(app, otherCookies, orderId).expect(HttpStatus.NOT_FOUND);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });

  it('should return 404 when the order does not exist', async () => {
    const { cookies } = await registerUser(app);

    const response = await cancelOrder(app, cookies, MISSING_ORDER_ID).expect(HttpStatus.NOT_FOUND);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
  });

  it('should return 400 with a field error when the order id is not a number', async () => {
    const { cookies } = await registerUser(app);

    const response = await cancelOrder(app, cookies, 'abc').expect(HttpStatus.BAD_REQUEST);

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

    await postApi(app, path).expect(HttpStatus.UNAUTHORIZED);
  });
});
