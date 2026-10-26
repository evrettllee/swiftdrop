import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CLIENT_ORDER_COURIER_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignCourier, placeConfirmedOrder } from '@test/support/chat';
import { COURIER_ACCOUNT } from '@test/support/couriers';
import { getApi } from '@test/support/http';
import { type Cookies, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Phone of the courier for the client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  function getOrderCourier(cookies: Cookies) {
    const path = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.COURIER.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return getApi(app, path).set(COOKIE_HEADER, cookies);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    await assignCourier(app, db, orderId);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each<OrderStatus>([
    ORDER_STATUS.COURIER_ASSIGNED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
  ])('should give the phone of the courier when the order is %s', async (status) => {
    await setOrderStatus(db, orderId, status);

    const response = await getOrderCourier(clientCookies).expect(HttpStatus.OK);

    expect(response.body.courier.phone).toBe(COURIER_ACCOUNT.phone);
  });

  it('should leave the phone key out once the order is delivered', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);

    const response = await getOrderCourier(clientCookies).expect(HttpStatus.OK);

    expect(response.body.courier).not.toHaveProperty('phone');
    expect(JSON.stringify(response.body)).not.toContain(COURIER_ACCOUNT.phone);
  });

  it('should leave the phone out once the order is cancelled', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CANCELLED);

    const response = await getOrderCourier(clientCookies).expect(HttpStatus.OK);

    expect(response.body.courier).toBeNull();
    expect(JSON.stringify(response.body)).not.toContain(COURIER_ACCOUNT.phone);
  });

  it('should answer not found and no phone when the order belongs to another client', async () => {
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);

    const response = await getOrderCourier(otherCookies).expect(HttpStatus.NOT_FOUND);

    expect(JSON.stringify(response.body)).not.toContain(COURIER_ACCOUNT.phone);
  });
});
