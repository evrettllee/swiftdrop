import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { COURIER_SOCKET_EVENTS } from '../../../src/modules/couriers/constants/couriers-socket.constants';
import { ORDER_ROOM_EVENTS } from '../../../src/modules/tracking/constants/tracking.constants';
import type { OrderEtaEvent } from '../../../src/modules/tracking/types/tracking.types';
import { registerUser } from '../../support/auth';
import { OpenSockets, placeConfirmedOrder } from '../../support/chat';
import { placeCourierAt } from '../../support/couriers';
import { MINSK_PICKUP } from '../../support/fixtures';
import { createRoutingMocks, createRoutingTestApp, resetRouting } from '../../support/routing';
import {
  collectEvents,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '../../support/sockets';
import { assignTrackedCourier, sendLocation, trackEstimates } from '../../support/tracking';

// Older than the limit of positions per courier, so the next one is stored.
const PAST_POSITION_MS = 10_000;

describe('Arrival estimate of an order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let orderId: number;
  let client: Socket;
  let courier: { cookies: string; courierProfileId: number };
  const sockets = new OpenSockets();
  const mocks = createRoutingMocks();

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    const { cookies } = await registerUser(app);
    orderId = await placeConfirmedOrder(app, db, cookies);
    courier = await assignTrackedCourier(app, db, orderId);
    client = await sockets.connect(baseUrl, cookies);
    await joinOrderRoom(client, { orderId });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send order:eta after a position and keep the same time in the order', async () => {
    const received = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);

    await sendLocation(await sockets.connect(baseUrl, courier.cookies));

    const event = await received;
    const [order] = await db
      .select({ estimatedDeliveryAt: orders.estimatedDeliveryAt })
      .from(orders)
      .where(eq(orders.orderId, orderId));
    expect(event).toEqual({
      orderId,
      estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString(),
      courierLeg: { geometry: expect.any(String), toPoint: 'pickup' },
    });
  });

  it('should not ask the routing service again for a position within 30 seconds', async () => {
    const firstEstimate = waitForEvent(client, ORDER_ROOM_EVENTS.ORDER_ETA);
    await sendLocation(await sockets.connect(baseUrl, courier.cookies));
    await firstEstimate;
    await placeCourierAt(
      db,
      courier.courierProfileId,
      MINSK_PICKUP,
      new Date(Date.now() - PAST_POSITION_MS),
    );
    const secondPosition = waitForEvent(client, COURIER_SOCKET_EVENTS.COURIER_LOCATION);

    await expect(sendLocation(await sockets.connect(baseUrl, courier.cookies))).resolves.toEqual({
      ok: true,
    });

    await secondPosition;
    expect(mocks.getTrip).toHaveBeenCalledTimes(1);
  });

  it('should send no estimate while routing is unavailable, the position still works', async () => {
    mocks.isTripAvailable.mockReturnValue(false);
    const estimatesDone = trackEstimates(app);
    const estimates = collectEvents(client, ORDER_ROOM_EVENTS.ORDER_ETA);
    const position = waitForEvent(client, COURIER_SOCKET_EVENTS.COURIER_LOCATION);

    await expect(sendLocation(await sockets.connect(baseUrl, courier.cookies))).resolves.toEqual({
      ok: true,
    });

    await position;
    await estimatesDone();
    await roundTrip(client);
    expect(estimates).toEqual([]);
    expect(mocks.getTrip).not.toHaveBeenCalled();
  });
});
