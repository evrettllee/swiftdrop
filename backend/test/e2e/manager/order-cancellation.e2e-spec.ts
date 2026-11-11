import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDERS_ERROR_MESSAGES, ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { addCourierSession } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { createManager, getManagerOrder } from '@test/support/manager';
import { postManagerCancel } from '@test/support/manager-assignment';
import {
  cancelOrder,
  type Cookies,
  placeOrders,
  readOrderStatus,
  setOrderStatus,
} from '@test/support/orders';
import { createGatewayMock, resetGatewayMock } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

const REASON = 'Адрес доставки вне зоны';
const BODY = { reason: REASON };

describe('Cancellation of an order by a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let manager: string;
  let orderId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  function courierGet(cookies: string, path: string) {
    return getApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${path}`).set(COOKIE_HEADER, cookies);
  }

  async function readClientOrder() {
    const response = await getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`)
      .set(COOKIE_HEADER, client)
      .expect(HttpStatus.OK);

    return response.body as { cancelledBy: string | null; cancelReason: string | null };
  }

  it('should let a manager and an admin in, and keep a client, a courier and a guest out', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);

    await postManagerCancel(app, client, orderId, BODY).expect(HttpStatus.FORBIDDEN);
    await postManagerCancel(app, courier.cookies, orderId, BODY).expect(HttpStatus.FORBIDDEN);
    await postManagerCancel(app, null, orderId, BODY).expect(HttpStatus.UNAUTHORIZED);
    await postManagerCancel(app, admin, orderId, BODY).expect(HttpStatus.OK);
  });

  it.each([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
    ORDER_STATUS.COURIER_ASSIGNED,
  ])(
    'should cancel an order in %s and show the reason to the staff and the client',
    async (status) => {
      await setOrderStatus(db, orderId, status);

      const response = await postManagerCancel(app, manager, orderId, BODY).expect(HttpStatus.OK);
      const details = await getManagerOrder(app, manager, orderId).expect(HttpStatus.OK);

      expect(response.body).toEqual({ orderId, status: ORDER_STATUS.CANCELLED, refund: 'none' });
      expect((details.body as { history: unknown[] }).history.at(-1)).toMatchObject({
        status: ORDER_STATUS.CANCELLED,
        actor: 'staff',
        comment: REASON,
      });
      expect(await readClientOrder()).toMatchObject({ cancelledBy: 'staff', cancelReason: REASON });
    },
  );

  it('should give the client no reason when the client cancelled the order', async () => {
    await cancelOrder(app, client, orderId).expect(HttpStatus.OK);

    expect(await readClientOrder()).toMatchObject({ cancelledBy: 'client', cancelReason: null });
  });

  it('should take the order from its courier at once', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);

    await postManagerCancel(app, manager, orderId, BODY).expect(HttpStatus.OK);

    const current = await courierGet(courier.cookies, COURIER_ORDERS_ROUTES.CURRENT);
    await courierGet(courier.cookies, COURIER_ORDERS_ROUTES.CURRENT_ROUTE).expect(
      HttpStatus.NOT_FOUND,
    );

    expect(current.body).toEqual({ order: null });
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it.each([
    [ORDER_STATUS.PICKED_UP, ORDERS_ERROR_MESSAGES.CANNOT_CANCEL],
    [ORDER_STATUS.IN_TRANSIT, ORDERS_ERROR_MESSAGES.CANNOT_CANCEL],
    [ORDER_STATUS.DELIVERED, ORDERS_ERROR_MESSAGES.ALREADY_FINISHED],
    [ORDER_STATUS.CANCELLED, ORDERS_ERROR_MESSAGES.ALREADY_FINISHED],
  ])(
    'should refuse an order in %s with ORDER_NOT_CANCELLABLE',
    async (status: OrderStatus, message) => {
      await setOrderStatus(db, orderId, status);

      const response = await postManagerCancel(app, manager, orderId, BODY).expect(
        HttpStatus.CONFLICT,
      );

      expect(response.body).toMatchObject({ code: 'ORDER_NOT_CANCELLABLE', message });
      expect(gateway.refund).not.toHaveBeenCalled();
    },
  );

  it('should answer 404 for a missing order and 400 for a body without a reason', async () => {
    await postManagerCancel(app, manager, orderId + 1000, BODY).expect(HttpStatus.NOT_FOUND);

    for (const body of [
      {},
      { reason: '   ' },
      { reason: 'х'.repeat(501) },
      { ...BODY, refund: 0 },
    ]) {
      await postManagerCancel(app, manager, orderId, body).expect(HttpStatus.BAD_REQUEST);
    }

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });
});
