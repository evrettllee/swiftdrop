import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import type { GeoPoint } from '../../../src/common/schemas/geo-point.schema';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orderOffers } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { COURIER_LOCATION_FRESH_MS } from '../../../src/modules/assignment/constants/assignment.constants';
import { CourierCandidatesService } from '../../../src/modules/assignment/services/courier-candidates.service';
import { DispatchOrdersService } from '../../../src/modules/assignment/services/dispatch-orders.service';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import {
  assignOrder,
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  ON_FOOT,
  placeCourierAt,
  putAvailability,
  putVehicle,
  SECOND_COURIER_ACCOUNT,
} from '../../support/couriers';
import {
  MINSK_DELIVERY,
  MINSK_PICKUP,
  MOSCOW,
  SMALL_PACKAGE,
  VALID_ORDER,
} from '../../support/fixtures';
import { type Cookies, placeOrders, postOrder } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

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

  // A courier on shift with the vehicle, standing at the point.
  async function addCourier(
    account: typeof COURIER_ACCOUNT,
    vehicle: Record<string, unknown>,
    point: GeoPoint,
  ): Promise<number> {
    const cookies = await createCourier(app, db, account);
    await putVehicle(app, cookies, vehicle).expect(HttpStatus.OK);
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    const courierProfileId = await findCourierProfileId(db, account.email);
    await placeCourierAt(db, courierProfileId, point);

    return courierProfileId;
  }

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
    const farther = await addCourier(COURIER_ACCOUNT, CAR, MINSK_DELIVERY);
    const nearer = await addCourier(SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    expect(await findCandidateIds(orderId)).toEqual([nearer, farther]);
  });

  it('should skip the courier when the position is stale', async () => {
    const courierId = await addCourier(COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const staleAt = new Date(Date.now() - COURIER_LOCATION_FRESH_MS - STALE_MARGIN_MS);
    await placeCourierAt(db, courierId, MINSK_PICKUP, staleAt);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the courier is out of the search radius', async () => {
    await addCourier(COURIER_ACCOUNT, CAR, MOSCOW);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the vehicle cannot carry the package', async () => {
    await addCourier(COURIER_ACCOUNT, ON_FOOT, MINSK_PICKUP);
    const heavyOrder = {
      ...VALID_ORDER,
      package: { ...SMALL_PACKAGE, weightKg: HEAVY_PACKAGE_KG },
    };
    const response = await postOrder(app, clientCookies, heavyOrder).expect(HttpStatus.CREATED);

    expect(await findCandidateIds(response.body.orderId)).toEqual([]);
  });

  it('should skip the courier when the courier already carries an order', async () => {
    const courierId = await addCourier(COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [carriedOrderId] = await placeOrders(app, clientCookies, 1);
    await assignOrder(db, carriedOrderId, courierId, ORDER_STATUS.PICKED_UP);

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the order was offered to the courier before', async () => {
    const courierId = await addCourier(COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await db.insert(orderOffers).values({
      orderId,
      courierId,
      status: ORDER_OFFER_STATUS.DECLINED,
      expiresAt: new Date(),
      pickupEtaSec: 0,
      totalEtaSec: 0,
    });

    expect(await findCandidateIds(orderId)).toEqual([]);
  });

  it('should skip the courier when the courier has an open offer of another order', async () => {
    const courierId = await addCourier(COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const [otherOrderId] = await placeOrders(app, clientCookies, 1);
    await db.insert(orderOffers).values({
      orderId: otherOrderId,
      courierId,
      expiresAt: new Date(),
      pickupEtaSec: 0,
      totalEtaSec: 0,
    });

    expect(await findCandidateIds(orderId)).toEqual([]);
  });
});
