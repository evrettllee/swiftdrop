import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OSRM_PROFILE } from '../../../src/integrations/osrm/constants/osrm.constants';
import { CLIENT_ORDER_COURIER_ROUTES } from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { ROUTE_SEGMENT_KIND } from '../../../src/modules/routing/constants/routing.constants';
import { OrderEtaService } from '../../../src/modules/tracking/services/order-eta.service';
import { addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, COURIER_ACCOUNT, ON_FOOT, placeCourierAt } from '../../support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from '../../support/fixtures';
import { getApi } from '../../support/http';
import { type Cookies, placeOrders, SECOND_CLIENT } from '../../support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  failRouting,
  lineThrough,
  resetRouting,
  staleTime,
} from '../../support/routing';

const PARCEL_LINE = lineThrough([MINSK_PICKUP, MINSK_DELIVERY]);

describe('Route of an order of the client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let courierCookies: string;
  let courierId: number;
  let orderId: number;
  const mocks = createRoutingMocks();

  function getOrderRoute(cookies: Cookies) {
    const path = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.ROUTE.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return getApi(app, path).set(COOKIE_HEADER, cookies);
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
      ON_FOOT,
      COURIER_POINT,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should route the parcel by car while the order has no courier', async () => {
    const response = await getOrderRoute(clientCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [{ kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: PARCEL_LINE }],
      courierPosition: null,
      pickupEtaAt: null,
    });
    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.CAR);
  });

  // The line of the courier comes from the arrival estimate, which a position starts in the app.
  it('should add the way of the courier to the pickup point, by their vehicle', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    await app.get(OrderEtaService).refresh(orderId, true);

    const response = await getOrderRoute(clientCookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: PARCEL_LINE },
        {
          kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
          geometry: lineThrough([COURIER_POINT, MINSK_PICKUP]),
        },
      ],
      courierPosition: { ...COURIER_POINT, updatedAt: expect.any(String), isStale: false },
      pickupEtaAt: expect.any(String),
    });
    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.FOOT);
    expect(mocks.getTrip).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.FOOT);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.CAR);
  });

  it('should show the way of the courier to the recipient after the pickup', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.IN_TRANSIT);
    await app.get(OrderEtaService).refresh(orderId, true);

    const response = await getOrderRoute(clientCookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: PARCEL_LINE },
      {
        kind: ROUTE_SEGMENT_KIND.TO_DROPOFF,
        geometry: lineThrough([COURIER_POINT, MINSK_DELIVERY]),
      },
    ]);
    expect(response.body.pickupEtaAt).toBeNull();
  });

  it('should leave out the courier once the order is delivered', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.DELIVERED);

    const response = await getOrderRoute(clientCookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: PARCEL_LINE },
    ]);
  });

  it('should return no line of the courier when their position is old', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    await placeCourierAt(db, courierId, COURIER_POINT, staleTime());
    await app.get(OrderEtaService).refresh(orderId, true);

    const response = await getOrderRoute(clientCookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: PARCEL_LINE },
      { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: null },
    ]);
  });

  it('should return no lines when the routing service is unavailable', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    failRouting(mocks);

    const response = await getOrderRoute(clientCookies).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: null },
      { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: null },
    ]);
  });

  it('should answer not found when the order belongs to another client', async () => {
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);

    await getOrderRoute(otherCookies).expect(HttpStatus.NOT_FOUND);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });

  it('should refuse the request when the user is a courier', async () => {
    await getOrderRoute(courierCookies).expect(HttpStatus.FORBIDDEN);
  });
});
