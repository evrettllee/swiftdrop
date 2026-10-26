import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_LOCATION_FRESH_MS } from '@/modules/assignment/constants/assignment.constants';
import { CourierCandidatesService } from '@/modules/assignment/services/courier-candidates.service';
import { DispatchOrdersService } from '@/modules/assignment/services/dispatch-orders.service';
import { createTestApp } from '@test/support/app';
import { addCourierOnShift, insertOffer } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import {
  assignOrder,
  CAR,
  COURIER_ACCOUNT,
  ON_FOOT,
  placeCourierAt,
  SECOND_COURIER_ACCOUNT,
} from '@test/support/couriers';
import {
  MINSK_DELIVERY,
  MINSK_PICKUP,
  MOSCOW,
  SMALL_PACKAGE,
  VALID_ORDER,
} from '@test/support/fixtures';
import { type Cookies, placeOrders, postOrder } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

// Only a car or a truck takes it.
const HEAVY_PACKAGE_KG = 20;
const STALE_MARGIN_MS = 1000;

describe('Courier candidates (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let candidates: CourierCandidatesService;
  let dispatchOrders: DispatchOrdersService;
  let clientCookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  async function findCandidateIds(id: number): Promise<number[]> {
    const order = await dispatchOrders.load(id);

    if (!order) {
      throw new Error(`Order ${id} is missing`);
    }

    const found = await candidates.findNearest(order);

    return found.map((candidate) => candidate.courierProfileId);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    candidates = app.get(CourierCandidatesService);
    dispatchOrders = app.get(DispatchOrdersService);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should load the points and the package of the order', async () => {
    expect(await dispatchOrders.load(orderId)).toEqual({
      orderId,
      pickup: MINSK_PICKUP,
      delivery: MINSK_DELIVERY,
      parcel: SMALL_PACKAGE,
    });
  });

  it('should return the couriers on shift with the nearest to the pickup point first', async () => {
    const farther = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_DELIVERY);
    const nearer = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    expect(await findCandidateIds(orderId)).toEqual([nearer, farther]);
  });

  it('should skip the courier when the position is stale', async () => {
    const courierId = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const staleAt = new Date(Date.now() - COURIER_LOCATION_FRESH_MS - STALE_MARGIN_MS);
    await placeCourierAt(db, courierId, MINSK_PICKUP, staleAt);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the courier is out of the search radius', async () => {
    await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MOSCOW);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the vehicle cannot carry the package', async () => {
    await addCourierOnShift(app, db, COURIER_ACCOUNT, ON_FOOT, MINSK_PICKUP);
    const heavyOrder = {
      ...VALID_ORDER,
      package: { ...SMALL_PACKAGE, weightKg: HEAVY_PACKAGE_KG },
    };
    const response = await postOrder(app, clientCookies, heavyOrder).expect(HttpStatus.CREATED);

    expect(await findCandidateIds(response.body.orderId)).toEqual([]);
  });

  it('should skip the courier when the courier already carries an order', async () => {
    const courierId = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [carriedOrderId] = await placeOrders(app, clientCookies, 1);
    await assignOrder(db, carriedOrderId, courierId, ORDER_STATUS.PICKED_UP);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the order was offered to the courier before', async () => {
    const courierId = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await insertOffer(db, orderId, courierId, { status: ORDER_OFFER_STATUS.DECLINED });

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the courier has an open offer of another order', async () => {
    const courierId = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [otherOrderId] = await placeOrders(app, clientCookies, 1);
    await insertOffer(db, otherOrderId, courierId);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier on shift nearby when the account is blocked', async () => {
    await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const activeId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_DELIVERY);
    await db.update(users).set({ isBlocked: true }).where(eq(users.email, COURIER_ACCOUNT.email));

    expect(await findCandidateIds(orderId)).toEqual([activeId]);
  });
});
