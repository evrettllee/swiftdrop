import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orderOffers } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { OFFER_TTL_MS } from '../../../src/modules/assignment/constants/assignment.constants';
import { AssignmentRoundService } from '../../../src/modules/assignment/services/assignment-round.service';
import type { CourierOffer } from '../../../src/modules/assignment/types/assignment.types';
import { COURIER_SOCKET_EVENTS } from '../../../src/modules/couriers/constants/couriers-socket.constants';
import { createTestApp } from '../../support/app';
import { addCourierOnShift, addCourierSession } from '../../support/assignment';
import { registerUser } from '../../support/auth';
import {
  CAR,
  COURIER_ACCOUNT,
  putAvailability,
  SECOND_COURIER_ACCOUNT,
} from '../../support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP, ROUTE } from '../../support/fixtures';
import { placeOrders, setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';
import { connectAppSocket, listenTestApp, waitForEvent } from '../../support/sockets';

// Every route in these tests is ROUTE: to the pickup point and then to the recipient.
const ROUTE_SEC = Math.ceil(ROUTE.durationSec);
const AFTER_EXPIRY_MS = OFFER_TTL_MS + 1000;

describe('Order dispatch offers (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let rounds: AssignmentRoundService;
  let orderId: number;
  let courierId: number;
  let courierCookies: string;
  let socket: Socket | undefined;
  // The routing service answers unless a test pauses it like its circuit breaker would.
  const getRoute = jest.fn();
  const isAvailable = jest.fn(() => true);

  function readOffers() {
    return db.select().from(orderOffers).orderBy(orderOffers.offerId);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute, isAvailable } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
    rounds = app.get(AssignmentRoundService);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
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

  it('should offer the order to the courier nearby and send the offer to the socket', async () => {
    socket = await connectAppSocket(baseUrl, courierCookies);
    const received = waitForEvent<CourierOffer>(socket, COURIER_SOCKET_EVENTS.OFFER_NEW);

    await rounds.run();

    const [offer] = await readOffers();
    expect(offer).toMatchObject({
      orderId,
      courierId,
      status: ORDER_OFFER_STATUS.PENDING,
      pickupEtaSec: ROUTE_SEC,
      totalEtaSec: ROUTE_SEC * 2,
    });
    expect(await received).toMatchObject({ offerId: offer.offerId, orderId });
  });

  it('should offer the order to the next courier when the first offer expires', async () => {
    const secondId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_DELIVERY);
    await rounds.run();

    await rounds.run(new Date(Date.now() + AFTER_EXPIRY_MS));

    const offers = await readOffers();
    expect(offers.map(({ courierId: id, status }) => ({ id, status }))).toEqual([
      { id: courierId, status: ORDER_OFFER_STATUS.EXPIRED },
      { id: secondId, status: ORDER_OFFER_STATUS.PENDING },
    ]);
  });

  it('should withdraw the open offer when the client cancels the order', async () => {
    socket = await connectAppSocket(baseUrl, courierCookies);
    await rounds.run();
    const [offer] = await readOffers();
    await setOrderStatus(db, orderId, ORDER_STATUS.CANCELLED);
    const closed = waitForEvent<{ offerId: number }>(socket, COURIER_SOCKET_EVENTS.OFFER_CLOSED);

    await rounds.run();

    expect(await closed).toEqual({ offerId: offer.offerId });
    expect((await readOffers())[0].status).toBe(ORDER_OFFER_STATUS.EXPIRED);
  });

  it('should withdraw the open offer when the courier goes off shift', async () => {
    await rounds.run();
    await putAvailability(app, courierCookies, { isAvailable: false }).expect(HttpStatus.OK);

    await rounds.run();

    expect((await readOffers())[0].status).toBe(ORDER_OFFER_STATUS.EXPIRED);
  });

  it('should close stale offers but open none while the routing service is paused', async () => {
    await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_DELIVERY);
    await rounds.run();
    getRoute.mockClear();
    isAvailable.mockReturnValueOnce(false);

    await rounds.run(new Date(Date.now() + AFTER_EXPIRY_MS));

    const offers = await readOffers();
    expect(offers.map(({ status }) => status)).toEqual([ORDER_OFFER_STATUS.EXPIRED]);
    expect(getRoute).not.toHaveBeenCalled();
  });
});
