import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { payments } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PAYMENT_EVENT } from '@/modules/payments/constants/payments.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { staffOrderEventSchema } from '@/modules/realtime/dto/staff-order-event.dto';
import type { StaffOrderEvent } from '@/modules/realtime/types/realtime.types';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { createManager, waitForStaffOrder } from '@test/support/manager';
import { cancelOrder, type Cookies, placeOrders } from '@test/support/orders';
import {
  createGatewayMock,
  insertPayment,
  PAYMENT_REF,
  postWebhook,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';

describe('Staff order events (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let client: Cookies;
  let managerSocket: Socket;
  let clientSocket: Socket;
  let courierSocket: Socket;
  let leaked: unknown[];
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
    managerSocket = await connectAppSocket(baseUrl, await createManager(app, db));
    clientSocket = await connectAppSocket(baseUrl, client);
    courierSocket = await connectAppSocket(baseUrl, await createCourier(app, db));
    leaked = [];
    clientSocket.on(SOCKET_EVENTS.STAFF_ORDER, (payload: unknown) => leaked.push(payload));
    courierSocket.on(SOCKET_EVENTS.STAFF_ORDER, (payload: unknown) => leaked.push(payload));
  });

  afterEach(() => {
    [managerSocket, clientSocket, courierSocket].forEach((socket) => socket.close());
  });

  afterAll(async () => {
    await app.close();
  });

  async function expectNothingLeaked(): Promise<void> {
    await roundTrip(clientSocket);
    await roundTrip(courierSocket);

    expect(leaked).toEqual([]);
  }

  it('should tell the manager about an order the client placed', async () => {
    const received = waitForEvent<StaffOrderEvent>(managerSocket, SOCKET_EVENTS.STAFF_ORDER);
    const [orderId] = await placeOrders(app, client, 1);

    const event = await received;

    expect(event).toEqual({
      orderId,
      kind: 'created',
      status: ORDER_STATUS.PENDING,
      statusChangedAt: expect.any(String),
      courierId: null,
    });
    expect(staffOrderEventSchema.safeParse(event).success).toBe(true);
    await expectNothingLeaked();
  });

  it('should tell the manager that the order was paid', async () => {
    const [orderId] = await placeOrders(app, client, 1);
    await insertPayment(db, orderId);
    const [{ sessionId }] = await db
      .select({ sessionId: payments.checkoutSessionId })
      .from(payments)
      .where(eq(payments.orderId, orderId));
    gateway.parseWebhook.mockReturnValueOnce({
      type: PAYMENT_EVENT.PAID,
      orderId,
      sessionId,
      paymentRef: PAYMENT_REF,
    });
    const received = waitForStaffOrder(managerSocket, orderId, 'status');

    await postWebhook(app, WEBHOOK_SIGNATURE).expect(HttpStatus.OK);

    expect(await received).toMatchObject({ orderId, status: ORDER_STATUS.CONFIRMED });
    await expectNothingLeaked();
  });

  it('should tell the manager that the client cancelled the order', async () => {
    const [orderId] = await placeOrders(app, client, 1);
    const received = waitForStaffOrder(managerSocket, orderId, 'status');

    await cancelOrder(app, client, orderId).expect(HttpStatus.OK);

    expect(await received).toMatchObject({
      orderId,
      kind: 'status',
      status: ORDER_STATUS.CANCELLED,
      courierId: null,
    });
    await expectNothingLeaked();
  });

  it('should send no order:status to the staff room', async () => {
    const statuses = collectEvents(managerSocket, SOCKET_EVENTS.ORDER_STATUS);
    const [orderId] = await placeOrders(app, client, 1);
    const received = waitForStaffOrder(managerSocket, orderId, 'status');

    await cancelOrder(app, client, orderId).expect(HttpStatus.OK);
    await received;

    expect(statuses).toEqual([]);
  });
});
