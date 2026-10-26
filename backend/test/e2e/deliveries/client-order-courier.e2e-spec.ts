import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { COURIER_SOCKET_EVENTS } from '../../../src/modules/couriers/constants/couriers-socket.constants';
import { CouriersGateway } from '../../../src/modules/couriers/gateways/couriers.gateway';
import { CLIENT_ORDER_COURIER_ROUTES } from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '../../support/couriers';
import { MINSK_PICKUP } from '../../support/fixtures';
import { getApi } from '../../support/http';
import {
  cancelOrder,
  type Cookies,
  placeOrders,
  readOrderStatus,
  SECOND_CLIENT,
  setOrderStatus,
} from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';
import { connectAppSocket, listenTestApp, waitForEvent } from '../../support/sockets';

const DELIVERY_CODE = '4821';

describe('Order courier for the client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let courierCookies: string;
  let courierId: number;
  let orderId: number;
  let socket: Socket | undefined;
  const getRoute = jest.fn();

  function getOrderCourier(cookies: Cookies) {
    const path = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.COURIER.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return getApi(app, path).set(COOKIE_HEADER, cookies);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    ({ courierProfileId: courierId, cookies: courierCookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    await db.update(orders).set({ otpCode: DELIVERY_CODE }).where(eq(orders.orderId, orderId));
  });

  afterEach(() => {
    socket?.close();
    socket = undefined;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should show no courier while the order is still waiting for one', async () => {
    const response = await getOrderCourier(clientCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({ courier: null, deliveryCode: null });
  });

  it('should show the courier and the vehicle but no code before the pickup', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);

    const response = await getOrderCourier(clientCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      courier: { name: 'Дмитрий С.', vehicle: CAR, phone: COURIER_ACCOUNT.phone },
      deliveryCode: null,
    });
  });

  it('should show the delivery code once the parcel is picked up', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.PICKED_UP);

    const response = await getOrderCourier(clientCookies).expect(HttpStatus.OK);

    expect(response.body.deliveryCode).toBe(DELIVERY_CODE);
    expect(response.body.courier).toEqual({
      name: 'Дмитрий С.',
      vehicle: CAR,
      phone: COURIER_ACCOUNT.phone,
    });
  });

  it('should answer not found when the order belongs to another client', async () => {
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);

    await getOrderCourier(otherCookies).expect(HttpStatus.NOT_FOUND);
  });

  it('should refuse the request when the user is a courier', async () => {
    await getOrderCourier(courierCookies).expect(HttpStatus.FORBIDDEN);
  });

  it('should tell the courier when the client cancels the assigned order', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    socket = await connectAppSocket(baseUrl, courierCookies);
    const cancelled = waitForEvent<{ orderId: number }>(
      socket,
      COURIER_SOCKET_EVENTS.ORDER_CANCELLED,
    );

    await cancelOrder(app, clientCookies, orderId).expect(HttpStatus.OK);

    expect(await cancelled).toEqual({ orderId });
  });

  it('should cancel the order as usual when telling the courier fails', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    const emit = jest.spyOn(app.get(CouriersGateway), 'emitToCourier').mockImplementation(() => {
      throw new Error('socket server is down');
    });

    try {
      const response = await cancelOrder(app, clientCookies, orderId).expect(HttpStatus.OK);

      expect(response.body).toEqual({ orderId, status: ORDER_STATUS.CANCELLED });
      expect(emit).toHaveBeenCalledTimes(1);
    } finally {
      emit.mockRestore();
    }

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });
});
