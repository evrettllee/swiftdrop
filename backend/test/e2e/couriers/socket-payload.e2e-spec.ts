import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_SOCKET_EVENTS,
  LOCATION_UPDATE_REJECTIONS,
  ORDER_JOIN_REJECTIONS,
  SOCKET_MAX_PAYLOAD_BYTES,
} from '@/modules/couriers/constants/couriers-socket.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { OpenSockets, orderJoinRefusal, placeConfirmedOrder } from '@test/support/chat';
import { resetServiceArea } from '@test/support/pricing';
import {
  emitWithAck,
  joinOrderRoom,
  listenTestApp,
  waitForDisconnect,
} from '@test/support/sockets';
import { assignTrackedCourier, REPORTED_POINT } from '@test/support/tracking';

// A body padded to the given size: the order id plus a field of filler.
function paddedJoin(orderId: number, bytes: number): { orderId: number; pad: string } {
  return { orderId, pad: 'x'.repeat(bytes) };
}

describe('Socket message size and shape (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: string;
  let orderId: number;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should read a message under the limit and keep the socket open', async () => {
    const socket = await sockets.connect(baseUrl, clientCookies);

    await expect(
      joinOrderRoom(socket, paddedJoin(orderId, SOCKET_MAX_PAYLOAD_BYTES / 2)),
    ).resolves.toEqual(orderJoinRefusal(ORDER_JOIN_REJECTIONS.INVALID));
    expect(socket.connected).toBe(true);
  });

  it('should close the socket on a message over the limit, before reading it', async () => {
    const socket = await sockets.connect(baseUrl, clientCookies);
    const closed = waitForDisconnect(socket);

    socket.emit(COURIER_SOCKET_EVENTS.ORDER_JOIN, paddedJoin(orderId, SOCKET_MAX_PAYLOAD_BYTES));

    await expect(closed).resolves.toEqual(expect.any(String));
    expect(socket.connected).toBe(false);
  });

  it('should refuse a position with a field it does not know as invalid_location', async () => {
    const courier = await assignTrackedCourier(app, db, orderId);
    const socket = await sockets.connect(baseUrl, courier.cookies);

    await expect(
      emitWithAck(socket, COURIER_SOCKET_EVENTS.LOCATION_UPDATE, { ...REPORTED_POINT, orderId }),
    ).resolves.toEqual({ ok: false, reason: LOCATION_UPDATE_REJECTIONS.INVALID_LOCATION });
  });
});
