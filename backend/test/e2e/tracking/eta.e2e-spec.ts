import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { COURIER_SOCKET_EVENTS } from '@/modules/couriers/constants/couriers-socket.constants';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import {
  DROPOFF_HANDOVER_MS,
  ORDER_ROOM_EVENTS,
  PICKUP_HANDOVER_MS,
} from '@/modules/tracking/constants/tracking.constants';
import type { OrderEtaEvent } from '@/modules/tracking/types/tracking.types';
import { registerUser } from '@test/support/auth';
import { OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { placeCourierAt } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import {
  createRoutingMocks,
  createRoutingTestApp,
  FIRST_LEG_DURATION_S,
  resetRouting,
  TRIP_DURATION_S,
} from '@test/support/routing';
import {
  collectEvents,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';
import { assignTrackedCourier, sendLocation, trackEstimates } from '@test/support/tracking';

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
      pickupEtaAt: expect.any(String),
    });
  });

  // The pickup is the first leg alone: the rest of the trip and the two handovers come after it.
  it('should send the arrival at the pickup point before the delivery estimate', async () => {
    const received = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);
    const sentAtMs = Date.now();

    await sendLocation(await sockets.connect(baseUrl, courier.cookies));

    const { pickupEtaAt, estimatedDeliveryAt } = await received;
    const receivedAtMs = Date.now();
    const pickupAtMs = Date.parse(pickupEtaAt ?? '');
    expect(pickupAtMs).toBeGreaterThanOrEqual(sentAtMs + FIRST_LEG_DURATION_S * MS_PER_SECOND);
    expect(pickupAtMs).toBeLessThanOrEqual(receivedAtMs + FIRST_LEG_DURATION_S * MS_PER_SECOND);
    expect(Date.parse(estimatedDeliveryAt) - pickupAtMs).toBe(
      (TRIP_DURATION_S - FIRST_LEG_DURATION_S) * MS_PER_SECOND +
        PICKUP_HANDOVER_MS +
        DROPOFF_HANDOVER_MS,
    );
  });

  it('should send no arrival at the pickup point once the parcel is picked up', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.PICKED_UP })
      .where(eq(orders.orderId, orderId));
    const received = waitForEvent<OrderEtaEvent>(client, ORDER_ROOM_EVENTS.ORDER_ETA);

    await sendLocation(await sockets.connect(baseUrl, courier.cookies));

    expect(await received).toMatchObject({
      courierLeg: { toPoint: 'dropoff' },
      pickupEtaAt: null,
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
