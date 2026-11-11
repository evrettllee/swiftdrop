import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { addCourierSession } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { sendChatMessage } from '@test/support/chat';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager, waitForStaffOrder } from '@test/support/manager';
import { postReassign, postRestartAssignment } from '@test/support/manager-assignment';
import { type Cookies, placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';

type Session = { courierProfileId: number; cookies: string };

describe('Events of a courier change by a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let client: Cookies;
  let manager: string;
  let orderId: number;
  let courier: Session;
  let other: Session;
  const sockets: Socket[] = [];
  const getRoute = jest.fn();
  const isAvailable = jest.fn(() => true);

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute, isAvailable } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
    manager = await createManager(app, db);
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.close());
  });

  afterAll(async () => {
    await app.close();
  });

  async function connect(cookies: string): Promise<Socket> {
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    return socket;
  }

  async function inOrderRoom(cookies: string): Promise<Socket> {
    const socket = await connect(cookies);
    await joinOrderRoom(socket, { orderId });

    return socket;
  }

  it('should tell the staff, both couriers and the room, and leave the old courier out of the room', async () => {
    const staff = waitForStaffOrder(await connect(manager), orderId, 'courier');
    const oldSocket = await inOrderRoom(courier.cookies);
    const newSocket = await connect(other.cookies);
    const clientSocket = await inOrderRoom(client);
    const unassigned = waitForEvent(oldSocket, SOCKET_EVENTS.ORDER_UNASSIGNED);
    const assigned = waitForEvent(newSocket, SOCKET_EVENTS.ORDER_ASSIGNED);
    const courierChanged = waitForEvent(clientSocket, SOCKET_EVENTS.ORDER_COURIER);
    const oldCourierEvents = collectEvents(oldSocket, SOCKET_EVENTS.ORDER_COURIER);
    const oldMessages = collectEvents(oldSocket, SOCKET_EVENTS.MESSAGE_NEW);

    await postReassign(app, manager, orderId, {
      courierId: other.courierProfileId,
      expectedCourierId: courier.courierProfileId,
    }).expect(HttpStatus.OK);

    expect(await staff).toMatchObject({
      kind: 'courier',
      status: ORDER_STATUS.COURIER_ASSIGNED,
      courierId: other.courierProfileId,
    });
    expect(await unassigned).toEqual({ orderId });
    expect(await assigned).toEqual({ orderId });
    expect(await courierChanged).toEqual({ orderId, courierId: other.courierProfileId });

    await joinOrderRoom(newSocket, { orderId });
    const delivered = waitForEvent(newSocket, SOCKET_EVENTS.MESSAGE_NEW);
    await sendChatMessage(app, client, orderId).expect(HttpStatus.CREATED);
    await delivered;
    await roundTrip(oldSocket);

    expect(oldCourierEvents).toEqual([]);
    expect(oldMessages).toEqual([]);
  });

  it('should take the order from its courier on a restart and tell the room there is no courier', async () => {
    const staff = waitForStaffOrder(await connect(manager), orderId, 'status');
    const oldSocket = await inOrderRoom(courier.cookies);
    const clientSocket = await inOrderRoom(client);
    const unassigned = waitForEvent(oldSocket, SOCKET_EVENTS.ORDER_UNASSIGNED);
    const courierChanged = waitForEvent(clientSocket, SOCKET_EVENTS.ORDER_COURIER);
    const status = waitForEvent(clientSocket, SOCKET_EVENTS.ORDER_STATUS);

    await postRestartAssignment(app, manager, orderId, {
      expectedCourierId: courier.courierProfileId,
    }).expect(HttpStatus.OK);

    expect(await staff).toMatchObject({ status: ORDER_STATUS.CONFIRMED, courierId: null });
    expect(await unassigned).toEqual({ orderId });
    expect(await courierChanged).toEqual({ orderId, courierId: null });
    expect(await status).toMatchObject({ orderId, status: ORDER_STATUS.CONFIRMED });
  });
});
