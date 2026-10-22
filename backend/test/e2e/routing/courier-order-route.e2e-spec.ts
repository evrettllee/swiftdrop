import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OSRM_PROFILE } from '../../../src/integrations/osrm/constants/osrm.constants';
import { COURIER_ORDERS_ROUTES } from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ROUTE_SEGMENT_KIND } from '../../../src/modules/routing/constants/routing.constants';
import { addCourierOnShift, addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import {
  assignOrder,
  CAR,
  COURIER_ACCOUNT,
  placeCourierAt,
  SECOND_COURIER_ACCOUNT,
} from '../../support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from '../../support/fixtures';
import { getApi } from '../../support/http';
import { type Cookies, placeOrders } from '../../support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  failRouting,
  lineThrough,
  resetRouting,
  staleTime,
} from '../../support/routing';

const ORDER_ROUTE_PATH = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.CURRENT_ROUTE}`;

describe('Route of the current order of the courier (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let courierCookies: string;
  let courierId: number;
  let orderId: number;
  const mocks = createRoutingMocks();

  function getOrderRoute(cookies: Cookies) {
    return getApi(app, ORDER_ROUTE_PATH).set(COOKIE_HEADER, cookies);
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    ({ courierProfileId: courierId, cookies: courierCookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      COURIER_POINT,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should route to the pickup point and on to the recipient before the pickup', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);

    const response = await getOrderRoute(courierCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
          geometry: lineThrough([COURIER_POINT, MINSK_PICKUP]),
        },
        {
          kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
          geometry: lineThrough([MINSK_PICKUP, MINSK_DELIVERY]),
        },
      ],
    });
    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.CAR);
  });

  it.each([ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT])(
    'should route only to the recipient once the order is %s',
    async (status) => {
      await assignOrder(db, orderId, courierId, status);

      const response = await getOrderRoute(courierCookies).expect(HttpStatus.OK);

      expect(response.body).toEqual({
        segments: [
          {
            kind: ROUTE_SEGMENT_KIND.TO_DROPOFF,
            geometry: lineThrough([COURIER_POINT, MINSK_DELIVERY]),
          },
        ],
      });
    },
  );

  it('should return no lines when the routing service is unavailable', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    failRouting(mocks);

    const response = await getOrderRoute(courierCookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: null },
      { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: null },
    ]);
  });

  it('should keep the trip of the parcel when the position of the courier is old', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    await placeCourierAt(db, courierId, COURIER_POINT, staleTime());

    const response = await getOrderRoute(courierCookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: null },
      {
        kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
        geometry: lineThrough([MINSK_PICKUP, MINSK_DELIVERY]),
      },
    ]);
  });

  it('should answer not found when the order is with another courier', async () => {
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, COURIER_POINT);
    await assignOrder(db, orderId, otherId, ORDER_STATUS.COURIER_ASSIGNED);

    await getOrderRoute(courierCookies).expect(HttpStatus.NOT_FOUND);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });

  it('should refuse the request when the user is a client', async () => {
    await getOrderRoute(clientCookies).expect(HttpStatus.FORBIDDEN);
  });
});
