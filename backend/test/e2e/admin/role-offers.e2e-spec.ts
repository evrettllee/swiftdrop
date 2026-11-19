import { ConflictException, ForbiddenException, HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orderOffers } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { AssignmentRoundService } from '@/modules/assignment/services/assignment-round.service';
import { OfferResponsesService } from '@/modules/assignment/services/offer-responses.service';
import { CourierAvailabilityService } from '@/modules/couriers/services/courier-availability.service';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { postRole } from '@test/support/admin-staff';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import {
  CAR,
  COURIER_ACCOUNT,
  placeCourierAt,
  SECOND_COURIER_ACCOUNT,
} from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager } from '@test/support/manager';
import { postAssign } from '@test/support/manager-assignment';
import { placeOrders, readOrderStatus, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Admin role change and courier offers (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let orderId: number;
  let profileId: number;
  let userId: number;
  const getRoute = jest.fn();
  const isAvailable = jest.fn(() => true);

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute, isAvailable } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    ({ courierProfileId: profileId } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    userId = await findUserId(db, COURIER_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  function offersOf(courierId: number) {
    return db.select().from(orderOffers).where(eq(orderOffers.courierId, courierId));
  }

  async function makeManager(): Promise<void> {
    await postRole(app, admin, userId, { role: ROLE.MANAGER }).expect(HttpStatus.OK);
  }

  it('should expire the open offer and pass the order to the next courier as after a timeout', async () => {
    const offerId = await insertOffer(db, orderId, profileId);
    const next = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    await makeManager();

    const [closed] = await offersOf(profileId);
    expect(closed).toMatchObject({ offerId, status: ORDER_OFFER_STATUS.EXPIRED });

    await app.get(AssignmentRoundService).run();

    expect(await offersOf(next.courierProfileId)).toEqual([
      expect.objectContaining({ orderId, status: ORDER_OFFER_STATUS.PENDING }),
    ]);
    expect(await offersOf(profileId)).toHaveLength(1);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should refuse an accept that was already past the role guard', async () => {
    await makeManager();
    const offerId = await insertOffer(db, orderId, profileId);

    await expect(
      app.get(OfferResponsesService).accept(userId, profileId, offerId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should refuse going on shift for a request that was already past the role guard', async () => {
    await makeManager();

    await expect(app.get(CourierAvailabilityService).set(userId, true)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    const [profile] = await db
      .select()
      .from(courierProfiles)
      .where(eq(courierProfiles.courierProfileId, profileId));
    expect(profile.isAvailable).toBe(false);
  });

  it('should never assign or offer an order to a manager even with a profile on shift', async () => {
    await makeManager();
    await db
      .update(courierProfiles)
      .set({ isAvailable: true })
      .where(eq(courierProfiles.courierProfileId, profileId));
    await placeCourierAt(db, profileId, MINSK_PICKUP);
    const manager = await createManager(app, db);

    await postAssign(app, manager, orderId, profileId).expect(HttpStatus.NOT_FOUND);
    await app.get(AssignmentRoundService).run();

    expect(await offersOf(profileId)).toHaveLength(0);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });
});
