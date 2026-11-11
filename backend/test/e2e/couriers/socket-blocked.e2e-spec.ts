import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { LOCATION_UPDATE_REJECTIONS } from '@/modules/couriers/constants/courier-location.constants';
import { ORDER_JOIN_REJECTIONS } from '@/modules/realtime/constants/realtime.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { SOCKET_ERRORS } from '@/modules/realtime/constants/realtime.constants';
import { createTestApp } from '@test/support/app';
import { registerUser, validRegistration } from '@test/support/auth';
import { OpenSockets, orderJoinRefusal, placeConfirmedOrder } from '@test/support/chat';
import { COURIER_ACCOUNT } from '@test/support/couriers';
import { SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  connectAppSocket,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForDisconnect,
} from '@test/support/sockets';
import { assignTrackedCourier, readCourierProfile, sendLocation } from '@test/support/tracking';
import { blockUser } from '@test/support/users';

// The reason socket.io gives when the server itself closed the connection.
const SERVER_DISCONNECT_REASON = 'io server disconnect';

describe('Blocked users on the app socket (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: string;
  let clientUserId: number;
  let orderId: number;
  let courier: { cookies: string; courierProfileId: number };
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    clientCookies = client.cookies;
    clientUserId = client.body.user.userId;
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    courier = await assignTrackedCourier(app, db, orderId);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a blocked client and a blocked courier at the connection', async () => {
    await blockUser(db, validRegistration.email);
    await blockUser(db, COURIER_ACCOUNT.email);

    for (const cookies of [clientCookies, courier.cookies]) {
      await expect(connectAppSocket(baseUrl, cookies)).rejects.toThrow(SOCKET_ERRORS.UNAUTHORIZED);
    }
  });

  it('should answer an open socket of a client blocked since with not_found, then close it', async () => {
    const socket = await sockets.connect(baseUrl, clientCookies);
    await blockUser(db, validRegistration.email);
    const closed = waitForDisconnect(socket);

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(
      orderJoinRefusal(ORDER_JOIN_REJECTIONS.NOT_FOUND),
    );
    await expect(closed).resolves.toBe(SERVER_DISCONNECT_REASON);
  });

  it('should close the socket of a client blocked since who asks for a foreign order', async () => {
    const other = await registerUser(app, SECOND_CLIENT);
    const foreignOrderId = await placeConfirmedOrder(app, db, other.cookies);
    const socket = await sockets.connect(baseUrl, clientCookies);
    await blockUser(db, validRegistration.email);
    const closed = waitForDisconnect(socket);

    await expect(joinOrderRoom(socket, { orderId: foreignOrderId })).resolves.toEqual(
      orderJoinRefusal(ORDER_JOIN_REJECTIONS.NOT_FOUND),
    );
    await expect(closed).resolves.toBe(SERVER_DISCONNECT_REASON);
  });

  it('should refuse a position of a courier blocked since, keep none and close the socket', async () => {
    const socket = await sockets.connect(baseUrl, courier.cookies);
    const before = await readCourierProfile(db, courier.courierProfileId);
    await blockUser(db, COURIER_ACCOUNT.email);
    const closed = waitForDisconnect(socket);

    await expect(sendLocation(socket)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.UNAUTHORIZED,
    });
    await expect(closed).resolves.toBe(SERVER_DISCONNECT_REASON);
    const after = await readCourierProfile(db, courier.courierProfileId);
    expect(after.locationUpdatedAt).toEqual(before.locationUpdatedAt);
    expect([after.currentLat, after.currentLng]).toEqual([before.currentLat, before.currentLng]);
  });

  it('should close every socket of one user and leave the others open', async () => {
    const tabs = [
      await sockets.connect(baseUrl, clientCookies),
      await sockets.connect(baseUrl, clientCookies),
    ];
    const other = await sockets.connect(baseUrl, courier.cookies);
    const closed = tabs.map((tab) => waitForDisconnect(tab));

    app.get(RealtimeEventsService).disconnectUser(clientUserId);

    await expect(Promise.all(closed)).resolves.toEqual([
      SERVER_DISCONNECT_REASON,
      SERVER_DISCONNECT_REASON,
    ]);
    await roundTrip(other);
    expect(other.connected).toBe(true);
  });
});
