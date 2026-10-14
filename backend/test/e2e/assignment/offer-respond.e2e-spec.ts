import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orderOffers, orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '../../../src/modules/assignment/constants/assignment.constants';
import { createTestApp } from '../../support/app';
import { addCourierOnShift, addCourierSession, insertOffer } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '../../support/couriers';
import { MINSK_PICKUP } from '../../support/fixtures';
import { postApi } from '../../support/http';
import { placeOrders, readOrderStatus, setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

type OfferAction = typeof COURIER_OFFERS_ROUTES.ACCEPT | typeof COURIER_OFFERS_ROUTES.DECLINE;

const PAST_MS = 1000;

describe('Offer responses (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let courierId: number;
  let cookies: string;
  let offerId: number;
  const getRoute = jest.fn();

  function respond(action: OfferAction, id: number | string = offerId) {
    const path = `${COURIER_OFFERS_ROUTES.BASE}/${action.replace(OFFER_ID_ROUTE_PARAM, String(id))}`;

    return postApi(app, path).set(COOKIE_HEADER, cookies);
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
    const client = await registerUser(app);
    [orderId] = await placeOrders(app, client.cookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
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

  it('should give the order to the courier when the offer is accepted', async () => {
    const response = await respond(COURIER_OFFERS_ROUTES.ACCEPT).expect(HttpStatus.OK);

    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    expect(response.body).toEqual({ orderId });
    expect(order).toMatchObject({ status: ORDER_STATUS.COURIER_ASSIGNED, courierId });
    expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.ACCEPTED);
  });

  it('should give the order to one courier tab when two accepts come at once', async () => {
    const [first, second] = await Promise.all([
      respond(COURIER_OFFERS_ROUTES.ACCEPT),
      respond(COURIER_OFFERS_ROUTES.ACCEPT),
    ]);

    const statuses = [first.status, second.status].sort((left, right) => left - right);
    expect(statuses).toEqual([HttpStatus.OK, HttpStatus.CONFLICT]);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.COURIER_ASSIGNED);
  });

  it('should refuse to accept the offer when its time is up', async () => {
    await db
      .update(orderOffers)
      .set({ expiresAt: new Date(Date.now() - PAST_MS) })
      .where(eq(orderOffers.offerId, offerId));

    await respond(COURIER_OFFERS_ROUTES.ACCEPT).expect(HttpStatus.CONFLICT);

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should keep the offer open when the order was cancelled before the accept', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CANCELLED);

    await respond(COURIER_OFFERS_ROUTES.ACCEPT).expect(HttpStatus.CONFLICT);

    expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.PENDING);
  });

  it('should answer not found when the offer belongs to another courier', async () => {
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await db.delete(orderOffers);
    offerId = await insertOffer(db, orderId, otherId);

    await respond(COURIER_OFFERS_ROUTES.ACCEPT).expect(HttpStatus.NOT_FOUND);
  });

  it('should decline the offer and leave the order waiting for another courier', async () => {
    await respond(COURIER_OFFERS_ROUTES.DECLINE).expect(HttpStatus.NO_CONTENT);

    expect(await readOfferStatus()).toBe(ORDER_OFFER_STATUS.DECLINED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should refuse the second answer when the offer is already declined', async () => {
    await respond(COURIER_OFFERS_ROUTES.DECLINE).expect(HttpStatus.NO_CONTENT);

    await respond(COURIER_OFFERS_ROUTES.DECLINE).expect(HttpStatus.CONFLICT);
  });

  it('should refuse the request when the offer id is not a number', async () => {
    await respond(COURIER_OFFERS_ROUTES.ACCEPT, 'abc').expect(HttpStatus.BAD_REQUEST);
  });
});
