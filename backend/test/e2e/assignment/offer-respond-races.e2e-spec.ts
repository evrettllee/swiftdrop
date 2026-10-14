import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DB_LOCK_TIMEOUT_MS, DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orderOffers } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  ASSIGNMENT_ERROR_MESSAGES,
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '../../../src/modules/assignment/constants/assignment.constants';
import { createTestApp } from '../../support/app';
import { addCourierSession, insertOffer } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { LOCK_TEST_MARGIN_MS } from '../../support/constants';
import { CAR, COURIER_ACCOUNT, putAvailability } from '../../support/couriers';
import { MINSK_PICKUP } from '../../support/fixtures';
import { postApi } from '../../support/http';
import { holdOffer, holdOrder, whileRowsAreHeld } from '../../support/locks';
import { type Cookies, placeOrders, readOrderStatus, setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

type OfferAction = typeof COURIER_OFFERS_ROUTES.ACCEPT | typeof COURIER_OFFERS_ROUTES.DECLINE;

describe('Offer responses under concurrent changes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let clientCookies: Cookies;
  let cookies: string;
  let offerId: number;
  const getRoute = jest.fn();

  function respond(action: OfferAction, sessionCookies: Cookies = cookies) {
    const path = `${COURIER_OFFERS_ROUTES.BASE}/${action.replace(OFFER_ID_ROUTE_PARAM, String(offerId))}`;

    return postApi(app, path).set(COOKIE_HEADER, sessionCookies);
  }

  async function readOfferStatus(): Promise<string> {
    const [offer] = await db
      .select({ status: orderOffers.status })
      .from(orderOffers)
      .where(eq(orderOffers.offerId, offerId));

    return offer.status;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    let courierId: number;
    ({ courierProfileId: courierId, cookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    offerId = await insertOffer(db, orderId, courierId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse the accept when the courier went off shift before the job closed the offer', async () => {
    await putAvailability(app, cookies, { isAvailable: false }).expect(HttpStatus.OK);

    const response = await respond(COURIER_OFFERS_ROUTES.ACCEPT).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ASSIGNMENT_ERROR_MESSAGES.OFFER_CLOSED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
    expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.PENDING);
  });

  it(
    'should answer 409 and keep the order waiting when the accept meets a cancellation in progress',
    async () => {
      const response = await whileRowsAreHeld(db, holdOrder(orderId), () =>
        respond(COURIER_OFFERS_ROUTES.ACCEPT),
      );

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(ASSIGNMENT_ERROR_MESSAGES.BUSY);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
      expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.PENDING);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );

  it(
    'should answer 409 and keep the offer open when the decline meets an accept in progress',
    async () => {
      const response = await whileRowsAreHeld(db, holdOffer(offerId), () =>
        respond(COURIER_OFFERS_ROUTES.DECLINE),
      );

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(ASSIGNMENT_ERROR_MESSAGES.BUSY);
      expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.PENDING);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );

  it('should refuse the accept when the user is a client', async () => {
    await respond(COURIER_OFFERS_ROUTES.ACCEPT, clientCookies).expect(HttpStatus.FORBIDDEN);

    expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.PENDING);
  });
});
