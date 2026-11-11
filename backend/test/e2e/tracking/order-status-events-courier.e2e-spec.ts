import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '@/modules/assignment/constants/assignment.constants';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { type Cookies, readOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { listenTestApp } from '@test/support/sockets';
import { settle, watchOrderStatus } from '@test/support/tracking';

describe('Order status events of the courier steps (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let orderId: number;
  let courier: { courierProfileId: number; cookies: string };
  let offerId: number;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  function courierPost(path: string) {
    return postApi(app, path).set(COOKIE_HEADER, courier.cookies);
  }

  function acceptOffer() {
    return courierPost(
      `${COURIER_OFFERS_ROUTES.BASE}/${COURIER_OFFERS_ROUTES.ACCEPT.replace(OFFER_ID_ROUTE_PARAM, String(offerId))}`,
    );
  }

  function step(route: string) {
    return courierPost(
      `${COURIER_ORDERS_ROUTES.BASE}/${route.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`,
    );
  }

  async function readDeliveryCode(): Promise<string | null> {
    const [order] = await db
      .select({ otpCode: orders.otpCode })
      .from(orders)
      .where(eq(orders.orderId, orderId));

    return order.otpCode;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    offerId = await insertOffer(db, orderId, courier.courierProfileId);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send every step from the accept to the delivery, in order', async () => {
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await acceptOffer().expect(HttpStatus.OK);
    await step(COURIER_ORDERS_ROUTES.PICKUP).expect(HttpStatus.OK);
    await step(COURIER_ORDERS_ROUTES.DEPART).expect(HttpStatus.OK);
    await step(COURIER_ORDERS_ROUTES.DELIVER)
      .send({ code: await readDeliveryCode() })
      .expect(HttpStatus.OK);

    await settle(client);
    expect(client.events.map((event) => event.status)).toEqual([
      ORDER_STATUS.COURIER_ASSIGNED,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.IN_TRANSIT,
      ORDER_STATUS.DELIVERED,
    ]);
    expect(client.events.every((event) => event.orderId === orderId)).toBe(true);
  });

  it('should send nothing when a step is refused with 409', async () => {
    await acceptOffer().expect(HttpStatus.OK);
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await step(COURIER_ORDERS_ROUTES.DEPART).expect(HttpStatus.CONFLICT);

    await settle(client);
    expect(client.events).toEqual([]);
  });

  // The order moves to courier_assigned inside the transaction, then the accept is refused and
  // the transaction rolls back: an event sent from inside it would have reached the client.
  it('should send nothing for a change that was rolled back', async () => {
    await db
      .update(courierProfiles)
      .set({ isAvailable: false })
      .where(eq(courierProfiles.courierProfileId, courier.courierProfileId));
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await acceptOffer().expect(HttpStatus.CONFLICT);

    await settle(client);
    expect(client.events).toEqual([]);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should send the event only once the change can be read from the database', async () => {
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);
    const statusAtEvent = new Promise<string>((resolve) => {
      client.socket.once(SOCKET_EVENTS.ORDER_STATUS, () => {
        void readOrderStatus(db, orderId).then(resolve);
      });
    });

    await acceptOffer().expect(HttpStatus.OK);

    expect(await statusAtEvent).toBe(ORDER_STATUS.COURIER_ASSIGNED);
  });
});
