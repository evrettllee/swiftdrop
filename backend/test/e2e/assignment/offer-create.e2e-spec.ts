import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { courierProfiles, orderOffers } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { OFFER_TTL_MS } from '../../../src/modules/assignment/constants/assignment.constants';
import { OrderOffersService } from '../../../src/modules/assignment/services/order-offers.service';
import { createTestApp } from '../../support/app';
import { addCourierOnShift } from '../../support/assignment';
import { registerUser } from '../../support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '../../support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from '../../support/fixtures';
import { placeOrders, setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

const PICKUP_ETA_SEC = 300;
const TOTAL_ETA_SEC = 1200;

describe('Order offer creation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let offers: OrderOffersService;
  let orderId: number;
  let courierId: number;
  const getRoute = jest.fn();

  function planFor(courierProfileId: number) {
    return { courierProfileId, pickupEtaSec: PICKUP_ETA_SEC, totalEtaSec: TOTAL_ETA_SEC };
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    offers = app.get(OrderOffersService);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    courierId = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should open a pending offer that expires after the offer time', async () => {
    const now = new Date();

    const offerId = await offers.create(orderId, planFor(courierId), now);

    const [offer] = await db.select().from(orderOffers);
    expect(offer.offerId).toBe(offerId);
    expect(offer).toMatchObject({
      orderId,
      courierId,
      status: ORDER_OFFER_STATUS.PENDING,
      pickupEtaSec: PICKUP_ETA_SEC,
      totalEtaSec: TOTAL_ETA_SEC,
    });
    expect(offer.expiresAt.getTime()).toBe(now.getTime() + OFFER_TTL_MS);
  });

  it('should open no offer when the order is not confirmed', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.PENDING);

    const offerId = await offers.create(orderId, planFor(courierId));

    expect(offerId).toBeNull();
    expect(await db.select().from(orderOffers)).toHaveLength(0);
  });

  it('should open no offer when the courier went off shift', async () => {
    await db
      .update(courierProfiles)
      .set({ isAvailable: false, currentLat: null, currentLng: null, locationUpdatedAt: null })
      .where(eq(courierProfiles.courierProfileId, courierId));

    expect(await offers.create(orderId, planFor(courierId))).toBeNull();
  });

  it('should open no second offer when the order already has an open one', async () => {
    const secondId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_DELIVERY);
    await offers.create(orderId, planFor(courierId));

    const second = await offers.create(orderId, planFor(secondId));

    expect(second).toBeNull();
    expect(await db.select().from(orderOffers)).toHaveLength(1);
  });
});
