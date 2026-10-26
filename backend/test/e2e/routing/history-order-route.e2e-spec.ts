import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OSRM_PROFILE } from '@/integrations/osrm/constants/osrm.constants';
import { ROUTE_SEGMENT_KIND } from '@/modules/routing/constants/routing.constants';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from '@test/support/fixtures';
import { finishOrder, historyOrderRoutePath } from '@test/support/history-orders';
import { getApi } from '@test/support/http';
import { placeOrders } from '@test/support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  failRouting,
  lineThrough,
  resetRouting,
} from '@test/support/routing';

describe('Route of a finished order of the courier (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let courierCookies: string;
  let courierId: number;
  let orderId: number;
  const mocks = createRoutingMocks();

  function get(path: string) {
    return getApi(app, path).set(COOKIE_HEADER, courierCookies);
  }

  function finish(status: typeof ORDER_STATUS.DELIVERED): Promise<void> {
    return finishOrder(db, orderId, courierId, status);
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    const { cookies: clientCookies } = await registerUser(app);
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

  it('should route the parcel from the pickup to the delivery by the vehicle of the courier', async () => {
    await finish(ORDER_STATUS.DELIVERED);

    const response = await get(historyOrderRoutePath(orderId)).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
          geometry: lineThrough([MINSK_PICKUP, MINSK_DELIVERY]),
        },
      ],
    });
    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.CAR);
  });

  it('should return no line when the routing service is unavailable', async () => {
    await finish(ORDER_STATUS.DELIVERED);
    failRouting(mocks);

    const response = await get(historyOrderRoutePath(orderId)).expect(HttpStatus.OK);

    expect(response.body.segments).toEqual([
      { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: null },
    ]);
  });

  it('should not route an order that is not a finished one of the courier', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.IN_TRANSIT);

    await get(historyOrderRoutePath(orderId)).expect(HttpStatus.NOT_FOUND);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });
});
