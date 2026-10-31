import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { orders } from '@/database/schema';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { OrderEtaService } from '@/modules/tracking/services/order-eta.service';
import { registerUser } from '@test/support/auth';
import { OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { placeCourierAt } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { whileRowsAreHeld } from '@test/support/locks';
import { readOrderStatus } from '@test/support/orders';
import { createRoutingMocks, createRoutingTestApp, resetRouting } from '@test/support/routing';
import { collectEvents, joinOrderRoom, listenTestApp, roundTrip } from '@test/support/sockets';
import { assignTrackedCourier, sendLocation } from '@test/support/tracking';
import { statusChange } from '@test/support/order-status';

// Older than the limit of positions per courier, so the next one is stored.
const PAST_POSITION_MS = 10_000;

describe('Positions and estimates at the end of an order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let orderId: number;
  let client: Socket;
  let courier: { cookies: string; courierProfileId: number };
  const sockets = new OpenSockets();
  const mocks = createRoutingMocks();

  // The delivery of the order, made and not committed yet: the status change holds the order row.
  function deliverUncommitted(tx: Transaction) {
    return tx
      .update(orders)
      .set(statusChange(ORDER_STATUS.DELIVERED))
      .where(eq(orders.orderId, orderId));
  }

  async function readEstimate(): Promise<Date | null> {
    const [order] = await db
      .select({ estimatedDeliveryAt: orders.estimatedDeliveryAt })
      .from(orders)
      .where(eq(orders.orderId, orderId));

    return order.estimatedDeliveryAt;
  }

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
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  // The window of a position at the delivery: a delivery not yet committed is not seen, so that one
  // position still goes to the room. Once the delivery is committed no position goes there.
  it('should send no position to the room once the delivery is committed', async () => {
    const positions = collectEvents(client, SOCKET_EVENTS.COURIER_LOCATION);
    const socket = await sockets.connect(baseUrl, courier.cookies);

    await whileRowsAreHeld(db, deliverUncommitted, () => sendLocation(socket));
    await roundTrip(client);
    expect(positions).toHaveLength(1);

    await placeCourierAt(
      db,
      courier.courierProfileId,
      MINSK_PICKUP,
      new Date(Date.now() - PAST_POSITION_MS),
    );
    // A new socket: the one above may send its next position only in 5 seconds.
    const nextSocket = await sockets.connect(baseUrl, courier.cookies);
    await expect(sendLocation(nextSocket)).resolves.toEqual({ ok: true });
    await roundTrip(client);
    expect(positions).toHaveLength(1);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.DELIVERED);
  });

  // The estimate reads the order before the change and skips the row the change holds.
  it('should save no estimate and send no order:eta while the status is being changed', async () => {
    await placeCourierAt(db, courier.courierProfileId, MINSK_PICKUP, new Date());
    const estimates = collectEvents(client, SOCKET_EVENTS.ORDER_ETA);
    const before = await readEstimate();

    await whileRowsAreHeld(db, deliverUncommitted, () =>
      app.get(OrderEtaService).refresh(orderId, true),
    );

    await roundTrip(client);
    expect(mocks.getTrip).toHaveBeenCalledTimes(1);
    expect(estimates).toEqual([]);
    expect(await readEstimate()).toEqual(before);
  });
});
