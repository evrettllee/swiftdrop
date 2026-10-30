import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers, orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { StaleOffersService } from '@/modules/assignment/services/stale-offers.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import {
  createManager,
  getManagerOrder,
  postAssign,
  waitForStaffOrder,
} from '@test/support/manager';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, listenTestApp, waitForEvent } from '@test/support/sockets';

const FAR_FUTURE = new Date(Date.now() + 3_600_000);

describe('Manual assignment of a courier (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let manager: string;
  let orderIds: number[];
  let courier: { courierProfileId: number; cookies: string };
  let other: { courierProfileId: number; cookies: string };
  const sockets: Socket[] = [];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    orderIds = await placeOrders(app, cookies, 2);
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.CONFIRMED);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
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

  it('should give the order to the courier at once and record the manager as staff', async () => {
    const response = await postAssign(app, manager, orderIds[0], courier.courierProfileId).expect(
      HttpStatus.OK,
    );
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderIds[0]));
    const details = await getManagerOrder(app, manager, orderIds[0]).expect(HttpStatus.OK);

    expect(response.body).toEqual({ orderId: orderIds[0], courierId: courier.courierProfileId });
    expect(order).toMatchObject({
      status: ORDER_STATUS.COURIER_ASSIGNED,
      courierId: courier.courierProfileId,
    });
    expect((details.body as { history: { actor: string }[] }).history.at(-1)?.actor).toBe('staff');
  });

  it('should tell the staff, the courier and the couriers whose offers were revoked', async () => {
    const ownOfferId = await insertOffer(db, orderIds[1], courier.courierProfileId);
    const orderOfferId = await insertOffer(db, orderIds[0], other.courierProfileId);
    const staffEvent = waitForStaffOrder(await connect(manager), orderIds[0], 'status');
    const courierSocket = await connect(courier.cookies);
    const assigned = waitForEvent(courierSocket, SOCKET_EVENTS.ORDER_ASSIGNED);
    const ownClosed = waitForEvent(courierSocket, SOCKET_EVENTS.OFFER_CLOSED);
    const otherClosed = waitForEvent(await connect(other.cookies), SOCKET_EVENTS.OFFER_CLOSED);

    await postAssign(app, manager, orderIds[0], courier.courierProfileId).expect(HttpStatus.OK);

    expect(await staffEvent).toMatchObject({
      kind: 'status',
      status: ORDER_STATUS.COURIER_ASSIGNED,
      courierId: courier.courierProfileId,
    });
    expect(await assigned).toEqual({ orderId: orderIds[0] });
    expect(await ownClosed).toEqual({ offerId: ownOfferId });
    expect(await otherClosed).toEqual({ offerId: orderOfferId });
  });

  it('should leave the revoked offers revoked and the other order searching', async () => {
    const offerId = await insertOffer(db, orderIds[1], courier.courierProfileId);

    await postAssign(app, manager, orderIds[0], courier.courierProfileId).expect(HttpStatus.OK);
    await app.get(StaleOffersService).close(FAR_FUTURE);

    const [offer] = await db.select().from(orderOffers).where(eq(orderOffers.offerId, offerId));
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderIds[1]));

    expect(offer.status).toBe('revoked');
    expect(order.status).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should refuse a courier who is not available with the reason', async () => {
    await postAssign(app, manager, orderIds[0], courier.courierProfileId).expect(HttpStatus.OK);

    const response = await postAssign(app, manager, orderIds[1], courier.courierProfileId).expect(
      HttpStatus.CONFLICT,
    );

    expect(response.body).toMatchObject({ code: 'COURIER_NOT_AVAILABLE', reason: 'busy' });
  });
});
