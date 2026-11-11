import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_OFFERS_ROUTES } from '@/modules/assignment/constants/assignment.constants';
import { OfferNotifierService } from '@/modules/assignment/services/offer-notifier.service';
import type { CourierOffer } from '@/modules/assignment/types/assignment.types';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { createTestApp } from '@test/support/app';
import {
  addCourierOnShift,
  addCourierSession,
  insertOffer,
  OFFER_ETA,
} from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP, SMALL_PACKAGE, VALID_ORDER } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { type Cookies, placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, listenTestApp, waitForEvent } from '@test/support/sockets';

const CURRENT_OFFER_PATH = `${COURIER_OFFERS_ROUTES.BASE}/${COURIER_OFFERS_ROUTES.CURRENT}`;
// MINSK_DELIVERY rounded to the area the courier sees before accepting.
const DELIVERY_AREA = { latitude: 53.91, longitude: 27.46 };
const PAST_MS = 1000;

describe('Current courier offer (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let courierCookies: string;
  let courierId: number;
  let orderId: number;
  let socket: Socket | undefined;
  const getRoute = jest.fn();

  function getCurrentOffer(cookies: Cookies) {
    return getApi(app, CURRENT_OFFER_PATH).set(COOKIE_HEADER, cookies);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    ({ courierProfileId: courierId, cookies: courierCookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
  });

  afterEach(() => {
    socket?.close();
    socket = undefined;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return no offer when the courier has none', async () => {
    const response = await getCurrentOffer(courierCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({ offer: null });
  });

  it('should return the open offer with the delivery shown only to the street', async () => {
    const offerId = await insertOffer(db, orderId, courierId);

    const response = await getCurrentOffer(courierCookies).expect(HttpStatus.OK);

    expect(response.body.offer).toEqual({
      offerId,
      orderId,
      expiresAt: expect.any(String),
      ...OFFER_ETA,
      pickup: { ...VALID_ORDER.pickup, apartment: null },
      delivery: { city: 'Минск', street: VALID_ORDER.delivery.street, ...DELIVERY_AREA },
      parcel: SMALL_PACKAGE,
    });
  });

  it('should return no offer when the offer time is up', async () => {
    await insertOffer(db, orderId, courierId, { expiresAt: new Date(Date.now() - PAST_MS) });

    const response = await getCurrentOffer(courierCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({ offer: null });
  });

  it('should not show the offer of another courier', async () => {
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await insertOffer(db, orderId, otherId);

    const response = await getCurrentOffer(courierCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({ offer: null });
  });

  it('should refuse the request when the user is a client', async () => {
    await getCurrentOffer(clientCookies).expect(HttpStatus.FORBIDDEN);
  });

  it('should send the offer to the courier socket when the offer is announced', async () => {
    socket = await connectAppSocket(baseUrl, courierCookies);
    const offerId = await insertOffer(db, orderId, courierId);
    const received = waitForEvent<CourierOffer>(socket, SOCKET_EVENTS.OFFER_NEW);

    await app.get(OfferNotifierService).announce(offerId, courierId);

    const offer = await received;
    expect(offer).toMatchObject({ offerId, orderId, delivery: DELIVERY_AREA });
    expect(offer.delivery).not.toHaveProperty('house');
    expect(offer.delivery).not.toHaveProperty('apartment');
  });
});
