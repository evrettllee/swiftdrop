import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OSRM_PROFILE } from '@/integrations/osrm/constants/osrm.constants';
import { COURIER_OFFERS_ROUTES } from '@/modules/assignment/constants/assignment.constants';
import { ROUTE_SEGMENT_KIND } from '@/modules/routing/constants/routing.constants';
import { addCourierOnShift, addCourierSession, insertOffer } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import {
  CAR,
  COURIER_ACCOUNT,
  ON_FOOT,
  placeCourierAt,
  SECOND_COURIER_ACCOUNT,
} from '@test/support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { type Cookies, placeOrders, setOrderStatus } from '@test/support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  failRouting,
  lineThrough,
  resetRouting,
  staleTime,
} from '@test/support/routing';

const OFFER_ROUTE_PATH = `${COURIER_OFFERS_ROUTES.BASE}/${COURIER_OFFERS_ROUTES.CURRENT_ROUTE}`;

describe('Route of the current offer (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let orderId: number;
  const mocks = createRoutingMocks();

  function getOfferRoute(cookies: Cookies) {
    return getApi(app, OFFER_ROUTE_PATH).set(COOKIE_HEADER, cookies);
  }

  async function addCourierWithOffer(vehicle: Record<string, unknown> = CAR) {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, vehicle, COURIER_POINT);
    await insertOffer(db, orderId, courier.courierProfileId);

    return courier;
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should route the courier from their last position to the pickup point', async () => {
    const { cookies } = await addCourierWithOffer();

    const response = await getOfferRoute(cookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
          geometry: lineThrough([COURIER_POINT, MINSK_PICKUP]),
        },
      ],
    });
    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(
      [COURIER_POINT, MINSK_PICKUP],
      OSRM_PROFILE.CAR,
    );
  });

  it('should never route to the delivery point before the accept', async () => {
    const { cookies } = await addCourierWithOffer();

    const response = await getOfferRoute(cookies).expect(HttpStatus.OK);

    expect(mocks.getRouteGeometry).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mocks.getRouteGeometry.mock.calls)).not.toContain(
      String(MINSK_DELIVERY.longitude),
    );
    expect(JSON.stringify(response.body)).not.toContain(String(MINSK_DELIVERY.longitude));
  });

  it('should route by the profile of the vehicle of the courier', async () => {
    const { cookies } = await addCourierWithOffer(ON_FOOT);

    await getOfferRoute(cookies).expect(HttpStatus.OK);

    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.FOOT);
  });

  it('should return no line when the routing service is unavailable', async () => {
    const { cookies } = await addCourierWithOffer();
    failRouting(mocks);

    const response = await getOfferRoute(cookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [{ kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: null }],
    });
  });

  it('should return no line without asking the service when the position is old', async () => {
    const { cookies, courierProfileId } = await addCourierWithOffer();
    await placeCourierAt(db, courierProfileId, COURIER_POINT, staleTime());

    const response = await getOfferRoute(cookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: null },
    ]);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });

  it('should answer not found when the offer belongs to another courier', async () => {
    const { cookies } = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, COURIER_POINT);
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, COURIER_POINT);
    await insertOffer(db, orderId, otherId);

    await getOfferRoute(cookies).expect(HttpStatus.NOT_FOUND);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });

  it('should refuse the request when the user is a client', async () => {
    await getOfferRoute(clientCookies).expect(HttpStatus.FORBIDDEN);
  });
});
