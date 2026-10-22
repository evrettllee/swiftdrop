import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import {
  CLIENT_ORDER_COURIER_ROUTES,
  COURIER_ORDERS_ROUTES,
} from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { ROUTE_SEGMENT_KIND } from '../../../src/modules/routing/constants/routing.constants';
import { ORDER_ROOM_EVENTS } from '../../../src/modules/tracking/constants/tracking.constants';
import { OrderEtaStore } from '../../../src/modules/tracking/services/order-eta-store.service';
import type { OrderEtaEvent } from '../../../src/modules/tracking/types/tracking.types';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { OpenSockets, placeConfirmedOrder } from '../../support/chat';
import { MINSK_PICKUP } from '../../support/fixtures';
import { getApi, postApi } from '../../support/http';
import type { Cookies } from '../../support/orders';
import {
  createRoutingMocks,
  createRoutingTestApp,
  lineThrough,
  resetRouting,
} from '../../support/routing';
import { joinOrderRoom, listenTestApp, waitForEvent } from '../../support/sockets';
import { assignTrackedCourier, REPORTED_POINT, sendLocation } from '../../support/tracking';

// The line of the courier from the reported position to the pickup point, as the mock draws it.
const LEG_TO_PICKUP = lineThrough([REPORTED_POINT, MINSK_PICKUP]);

describe('Arrival estimate and the route of the client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let orderId: number;
  let client: Socket;
  let courier: { cookies: string; courierProfileId: number };
  const sockets = new OpenSockets();
  const mocks = createRoutingMocks();

  function getOrderRoute() {
    const path = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.ROUTE.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return getApi(app, path).set(COOKIE_HEADER, clientCookies).expect(HttpStatus.OK);
  }

  // The courier reports a position and the client gets the first estimate of it.
  async function firstEstimate(): Promise<OrderEtaEvent> {
    const received = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);
    await sendLocation(await sockets.connect(baseUrl, courier.cookies));

    return received;
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    courier = await assignTrackedCourier(app, db, orderId);
    client = await sockets.connect(baseUrl, clientCookies);
    await joinOrderRoom(client, { orderId });
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should estimate at once with the line to the recipient after the pickup', async () => {
    await firstEstimate();
    const afterPickup = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.PICKUP.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    await postApi(app, path).set(COOKIE_HEADER, courier.cookies).expect(HttpStatus.OK);

    expect((await afterPickup).courierLeg?.toPoint).toBe('dropoff');
    expect(mocks.getTrip).toHaveBeenCalledTimes(2);
  });

  it('should give the stored line of the courier in the route', async () => {
    await firstEstimate();

    const response = await getOrderRoute();

    expect(response.body.segments).toContainEqual({
      kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
      geometry: LEG_TO_PICKUP,
    });
  });

  it('should answer without the line after a restart and estimate in the background', async () => {
    await firstEstimate();
    app.get(OrderEtaStore).clear();
    const estimate = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);

    const response = await getOrderRoute();

    expect(response.body.segments).toContainEqual({
      kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
      geometry: null,
    });
    expect((await estimate).courierLeg).toEqual({ geometry: LEG_TO_PICKUP, toPoint: 'pickup' });
  });
});
