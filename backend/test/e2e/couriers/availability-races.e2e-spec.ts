import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE } from '../../../src/common/constants/database.constants';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database, Transaction } from '../../../src/database/database.module';
import { courierProfiles, orderOffers, orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  ASSIGNMENT_ERROR_MESSAGES,
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '../../../src/modules/assignment/constants/assignment.constants';
import { COURIERS_ERROR_MESSAGES } from '../../../src/modules/couriers/constants/couriers.constants';
import { createTestApp } from '../../support/app';
import { addCourierSession, insertOffer } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { placeConfirmedOrder } from '../../support/chat';
import { CAR, COURIER_ACCOUNT, putAvailability } from '../../support/couriers';
import { MINSK_PICKUP } from '../../support/fixtures';
import { postApi } from '../../support/http';
import { commitOnceBlocked } from '../../support/locks';
import { readOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';
import { readCourierProfile } from '../../support/tracking';

// Going off shift and accepting an offer in a fixed order: one side holds the courier profile row
// as the app does, the other is shown to wait for it, then the first commits.
describe('Going off shift against accepting an offer (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let offerId: number;
  let courier: { cookies: string; courierProfileId: number };
  const getRoute = jest.fn();

  function accept() {
    const path = `${COURIER_OFFERS_ROUTES.BASE}/${COURIER_OFFERS_ROUTES.ACCEPT.replace(OFFER_ID_ROUTE_PARAM, String(offerId))}`;

    return postApi(app, path).set(COOKIE_HEADER, courier.cookies);
  }

  function lockProfile(tx: Transaction) {
    return tx
      .select({ id: courierProfiles.courierProfileId })
      .from(courierProfiles)
      .where(eq(courierProfiles.courierProfileId, courier.courierProfileId))
      .for(ROW_LOCK_NO_KEY_UPDATE);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    orderId = await placeConfirmedOrder(app, db, cookies);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    offerId = await insertOffer(db, orderId, courier.courierProfileId);
  });

  afterAll(async () => {
    await app.close();
  });

  // The holding transaction does what an accept does: the offer, the order, then the profile lock.
  it('should refuse going off shift with 409 when an accept committed first', async () => {
    const response = await commitOnceBlocked(
      db,
      async (tx) => {
        await tx
          .update(orderOffers)
          .set({ status: ORDER_OFFER_STATUS.ACCEPTED, respondedAt: new Date() })
          .where(eq(orderOffers.offerId, offerId));
        await tx
          .update(orders)
          .set({ status: ORDER_STATUS.COURIER_ASSIGNED, courierId: courier.courierProfileId })
          .where(eq(orders.orderId, orderId));
        await lockProfile(tx);
      },
      () => putAvailability(app, courier.cookies, { isAvailable: false }),
    );

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body.message).toBe(COURIERS_ERROR_MESSAGES.ACTIVE_ORDER);
    expect((await readCourierProfile(db, courier.courierProfileId)).isAvailable).toBe(true);
  });

  // The holding transaction does what going off shift does: the profile lock, then the change.
  it('should refuse the accept with offer_closed when going off shift committed first', async () => {
    const response = await commitOnceBlocked(
      db,
      async (tx) => {
        await lockProfile(tx);
        await tx
          .update(courierProfiles)
          .set({ isAvailable: false, currentLat: null, currentLng: null, locationUpdatedAt: null })
          .where(eq(courierProfiles.courierProfileId, courier.courierProfileId));
      },
      accept,
    );

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body.message).toBe(ASSIGNMENT_ERROR_MESSAGES.OFFER_CLOSED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });
});
