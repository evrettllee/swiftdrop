import type { NestExpressApplication } from '@nestjs/platform-express';
import { sql } from 'drizzle-orm';
import { Socket as ServerSocket } from 'socket.io';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { orderRoom } from '@/modules/realtime/constants/realtime.constants';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { OrderRoomsService } from '@/modules/realtime/services/order-rooms.service';
import { SocketSessionTimersService } from '@/modules/realtime/services/socket-session-timers.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { placeConfirmedOrder } from '@test/support/chat';
import { commitOnceBlocked } from '@test/support/locks';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, listenTestApp } from '@test/support/sockets';

describe('Joining an order room while the socket closes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  // A plain read waits for no row lock, so the test holds the whole orders table: the check of the
  // participant waits for it while the socket closes, and goes on after the server saw it closed.
  it('should not put a socket closed during the check into the room', async () => {
    const { cookies } = await registerUser(app);
    const orderId = await placeConfirmedOrder(app, db, cookies);
    const socket = await connectAppSocket(baseUrl, cookies);
    const joins = jest.spyOn(ServerSocket.prototype, 'join');
    const checks = jest.spyOn(app.get(OrderRoomsService), 'participantAccess');
    const timers = app.get(SocketSessionTimersService);
    const clear = timers.clear.bind(timers);
    const serverSawClose = Promise.withResolvers<void>();
    jest.spyOn(timers, 'clear').mockImplementation((socketId) => {
      clear(socketId);
      serverSawClose.resolve();
    });

    await commitOnceBlocked(
      db,
      (tx) => tx.execute(sql`lock table orders in access exclusive mode`),
      async () => {
        socket.emit(SOCKET_EVENTS.ORDER_JOIN, { orderId });
      },
      async () => {
        socket.close();
        await serverSawClose.promise;
      },
    );

    expect(checks).toHaveBeenCalledTimes(1);
    await checks.mock.results[0].value;
    await new Promise(setImmediate);
    expect(joins).not.toHaveBeenCalledWith(orderRoom(orderId));
  });
});
