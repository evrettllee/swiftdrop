import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import {
  CLIENT_ORDER_COURIER_ROUTES,
  COURIER_ORDERS_ROUTES,
} from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { ROUTE_SEGMENT_KIND } from '../../../src/modules/routing/constants/routing.constants';
import { addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, COURIER_ACCOUNT, ON_FOOT, placeCourierAt } from '../../support/couriers';
import { MINSK_DELIVERY } from '../../support/fixtures';
import { getApi } from '../../support/http';
import { type Cookies, placeOrders } from '../../support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  lineThrough,
  resetRouting,
  staleTime,
} from '../../support/routing';
import { readCourierProfile } from '../../support/tracking';

describe('Courier position in the route of the client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let courier: { courierProfileId: number; cookies: string };
  let orderId: number;
  const mocks = createRoutingMocks();

  function getOrderRoute() {
    const path = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.ROUTE.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return getApi(app, path).set(COOKIE_HEADER, clientCookies);
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(db, mocks);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, ON_FOOT, COURIER_POINT);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.IN_TRANSIT);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should give an old position to the client, marked stale', async () => {
    await placeCourierAt(db, courier.courierProfileId, COURIER_POINT, staleTime());

    const response = await getOrderRoute().expect(HttpStatus.OK);

    const profile = await readCourierProfile(db, courier.courierProfileId);
    expect(response.body.courierPosition).toEqual({
      ...COURIER_POINT,
      updatedAt: profile.locationUpdatedAt?.toISOString(),
      isStale: true,
    });
  });

  it('should give a fresh position to the client, not stale', async () => {
    const response = await getOrderRoute().expect(HttpStatus.OK);

    expect(response.body.courierPosition).toMatchObject({ ...COURIER_POINT, isStale: false });
  });

  it('should give no position once the order is delivered', async () => {
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.DELIVERED);

    const response = await getOrderRoute().expect(HttpStatus.OK);

    expect(response.body.courierPosition).toBeNull();
  });

  it('should keep the route of the courier without the position fields', async () => {
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.CURRENT_ROUTE}`;

    const response = await getApi(app, path)
      .set(COOKIE_HEADER, courier.cookies)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.TO_DROPOFF,
          geometry: lineThrough([COURIER_POINT, MINSK_DELIVERY]),
        },
      ],
    });
  });
});
