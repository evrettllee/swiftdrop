import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { CLIENT_ORDER_COURIER_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { ROUTE_SEGMENT_KIND } from '@/modules/routing/constants/routing.constants';
import { OrderEtaService } from '@/modules/tracking/services/order-eta.service';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, COURIER_ACCOUNT, ON_FOOT, placeCourierAt } from '@test/support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { createManager, getManagerOrderRoute } from '@test/support/manager';
import { type Cookies, placeOrders } from '@test/support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  lineThrough,
  resetRouting,
  staleTime,
} from '@test/support/routing';

describe('Route of an order for a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let courier: string;
  let courierId: number;
  let manager: string;
  let orderId: number;
  const mocks = createRoutingMocks();

  function getClientRoute() {
    const path = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.ROUTE.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return getApi(app, path).set(COOKIE_HEADER, client);
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    ({ courierProfileId: courierId, cookies: courier } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      ON_FOOT,
      COURIER_POINT,
    ));
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a client and a courier', async () => {
    await getManagerOrderRoute(app, client, orderId).expect(HttpStatus.FORBIDDEN);
    await getManagerOrderRoute(app, courier, orderId).expect(HttpStatus.FORBIDDEN);
  });

  it('should answer 404 for a missing order', async () => {
    await getManagerOrderRoute(app, manager, orderId + 1000).expect(HttpStatus.NOT_FOUND);
  });

  it('should give the route of any order as the client sees it', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
    await app.get(OrderEtaService).refresh(orderId, true);

    const response = await getManagerOrderRoute(app, manager, orderId).expect(HttpStatus.OK);
    const forClient = await getClientRoute().expect(HttpStatus.OK);

    expect(response.body).toEqual(forClient.body);
    expect(response.body).toMatchObject({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
          geometry: lineThrough([MINSK_PICKUP, MINSK_DELIVERY]),
        },
        {
          kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
          geometry: lineThrough([COURIER_POINT, MINSK_PICKUP]),
        },
      ],
      courierPosition: { ...COURIER_POINT, isStale: false },
    });
  });

  it('should mark an old position of the courier as stale', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.PICKED_UP);
    await placeCourierAt(db, courierId, COURIER_POINT, staleTime());

    const response = await getManagerOrderRoute(app, manager, orderId).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({ courierPosition: { isStale: true } });
  });
});
