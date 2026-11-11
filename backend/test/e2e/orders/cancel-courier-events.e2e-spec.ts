import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager, waitForStaffOrder } from '@test/support/manager';
import { postManagerCancel } from '@test/support/manager-assignment';
import { cancelOrder, type Cookies, placeOrders, setOrderStatus } from '@test/support/orders';
import { createGatewayMock, resetGatewayMock } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';

const PROBE = 'probe';
const ACTORS = [['client'], ['staff']] as const;

describe('Events of a cancellation for the courier (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let client: Cookies;
  let manager: string;
  let orderId: number;
  let courier: { courierProfileId: number; cookies: string };
  const sockets: Socket[] = [];
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    manager = await createManager(app, db);
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.close());
  });

  afterAll(async () => {
    await app.close();
  });

  async function connect(cookies: string, room: boolean): Promise<Socket> {
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    if (room) {
      await joinOrderRoom(socket, { orderId });
    }

    return socket;
  }

  function cancelBy(actor: 'client' | 'staff') {
    return actor === 'client'
      ? cancelOrder(app, client, orderId)
      : postManagerCancel(app, manager, orderId, { reason: 'Отмена по просьбе клиента' });
  }

  it.each(ACTORS)(
    'should send order:cancelled to the courier and take the courier out of the room when the %s cancels',
    async (actor) => {
      await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
      const staff = waitForStaffOrder(await connect(manager, false), orderId, 'status');
      const courierSocket = await connect(courier.cookies, true);
      const clientSocket = await connect(client, true);
      const cancelled = waitForEvent(courierSocket, SOCKET_EVENTS.ORDER_CANCELLED);
      const status = waitForEvent(clientSocket, SOCKET_EVENTS.ORDER_STATUS);
      const unassigned = collectEvents(courierSocket, SOCKET_EVENTS.ORDER_UNASSIGNED);
      const courierProbes = collectEvents(courierSocket, PROBE);

      await cancelBy(actor).expect(HttpStatus.OK);

      expect(await cancelled).toEqual({ orderId });
      expect(await status).toMatchObject({ orderId, status: ORDER_STATUS.CANCELLED });
      expect(await staff).toMatchObject({ status: ORDER_STATUS.CANCELLED });

      const probe = waitForEvent(clientSocket, PROBE);
      app.get(RealtimeEventsService).toOrder(orderId, PROBE, { orderId });
      await probe;
      await roundTrip(courierSocket);

      expect(courierProbes).toEqual([]);
      expect(unassigned).toEqual([]);
    },
  );

  it.each(ACTORS)(
    'should revoke the open offer of the order at once when the %s cancels',
    async (actor) => {
      await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
      const offerId = await insertOffer(db, orderId, courier.courierProfileId);
      const closed = waitForEvent(
        await connect(courier.cookies, false),
        SOCKET_EVENTS.OFFER_CLOSED,
      );

      await cancelBy(actor).expect(HttpStatus.OK);

      const [offer] = await db.select().from(orderOffers).where(eq(orderOffers.offerId, offerId));
      expect(await closed).toEqual({ offerId });
      expect(offer.status).toBe('revoked');
    },
  );
});
