import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  CLIENT_ORDER_COURIER_ROUTES,
  COURIER_ORDERS_ROUTES,
} from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { ROUTE_SEGMENT_KIND } from '@/modules/routing/constants/routing.constants';
import {
  ETA_SHUTDOWN_WAIT_MS,
  ORDER_ROOM_EVENTS,
} from '@/modules/tracking/constants/tracking.constants';
import { OrderEtaStore } from '@/modules/tracking/services/order-eta-store.service';
import { OrderEtaService } from '@/modules/tracking/services/order-eta.service';
import type { OrderEtaEvent } from '@/modules/tracking/types/tracking.types';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getApi, postApi } from '@test/support/http';
import type { Cookies } from '@test/support/orders';
import {
  createRoutingMocks,
  createRoutingTestApp,
  lineThrough,
  resetRouting,
} from '@test/support/routing';
import { joinOrderRoom, listenTestApp, waitForEvent } from '@test/support/sockets';
import { assignTrackedCourier, REPORTED_POINT, sendLocation } from '@test/support/tracking';

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

  it('should give the arrival at the pickup point of the last estimate in the route', async () => {
    const { pickupEtaAt } = await firstEstimate();

    const response = await getOrderRoute();

    expect(pickupEtaAt).toEqual(expect.any(String));
    expect(response.body.pickupEtaAt).toBe(pickupEtaAt);
  });

  it('should give no arrival at the pickup point in the route after the pickup', async () => {
    await firstEstimate();
    const afterPickup = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.PICKUP.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;
    await postApi(app, path).set(COOKIE_HEADER, courier.cookies).expect(HttpStatus.OK);
    await afterPickup;

    const response = await getOrderRoute();

    expect(response.body.pickupEtaAt).toBeNull();
  });

  // The status changed and its estimate has not come yet: the stored arrival belongs to the old
  // point and is not given.
  it('should not give the arrival at the pickup point of the previous status', async () => {
    await firstEstimate();
    mocks.getTrip.mockResolvedValue(null);
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.PICKUP.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;
    await postApi(app, path).set(COOKIE_HEADER, courier.cookies).expect(HttpStatus.OK);
    await app.get(OrderEtaService).waitForIdle(ETA_SHUTDOWN_WAIT_MS);

    const response = await getOrderRoute();

    expect(response.body.pickupEtaAt).toBeNull();
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
    expect(response.body.pickupEtaAt).toBeNull();
    expect((await estimate).courierLeg).toEqual({ geometry: LEG_TO_PICKUP, toPoint: 'pickup' });
  });
});
