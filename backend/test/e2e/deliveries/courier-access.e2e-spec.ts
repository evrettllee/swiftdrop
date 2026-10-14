import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { DB_INTEGER_MAX } from '../../../src/common/constants/database.constants';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  CLIENT_ORDER_COURIER_ROUTES,
  COURIER_ORDERS_ROUTES,
  COURIER_STATS_ROUTES,
} from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { addCourierOnShift, addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '../../support/couriers';
import { MINSK_PICKUP } from '../../support/fixtures';
import { getApi, postApi } from '../../support/http';
import { type Cookies, placeOrders, readOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

const RIGHT_CODE = '4821';
// One more than an integer column holds: such an id must be refused before the query.
const TOO_BIG_ID = DB_INTEGER_MAX + 1;

describe('Courier order access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let clientCookies: Cookies;
  let courierCookies: string;
  const getRoute = jest.fn();

  function courierPath(action: string, id: number = orderId): string {
    return `${COURIER_ORDERS_ROUTES.BASE}/${action.replace(ORDER_ID_ROUTE_PARAM, String(id))}`;
  }

  function deliver(cookies: Cookies, id: number = orderId) {
    return postApi(app, courierPath(COURIER_ORDERS_ROUTES.DELIVER, id))
      .set(COOKIE_HEADER, cookies)
      .send({ code: RIGHT_CODE });
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    ({ cookies: courierCookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer not found and spend no attempt when the code is for another courier order', async () => {
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, otherId, ORDER_STATUS.IN_TRANSIT);
    await db.update(orders).set({ otpCode: RIGHT_CODE }).where(eq(orders.orderId, orderId));

    await deliver(courierCookies).expect(HttpStatus.NOT_FOUND);

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.IN_TRANSIT);
  });

  it('should refuse the code when the user is a client', async () => {
    await deliver(clientCookies).expect(HttpStatus.FORBIDDEN);
  });

  it('should refuse the history and the stats when the user is a client', async () => {
    const historyPath = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.HISTORY}`;
    const statsPath = `${COURIER_STATS_ROUTES.BASE}/${COURIER_STATS_ROUTES.TODAY}`;

    await getApi(app, historyPath).set(COOKIE_HEADER, clientCookies).expect(HttpStatus.FORBIDDEN);
    await getApi(app, statsPath).set(COOKIE_HEADER, clientCookies).expect(HttpStatus.FORBIDDEN);
  });

  it('should answer 400 when the order id is beyond an integer', async () => {
    const clientPath = `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${CLIENT_ORDER_COURIER_ROUTES.COURIER.replace(ORDER_ID_ROUTE_PARAM, String(TOO_BIG_ID))}`;

    await deliver(courierCookies, TOO_BIG_ID).expect(HttpStatus.BAD_REQUEST);
    await postApi(app, courierPath(COURIER_ORDERS_ROUTES.PICKUP, TOO_BIG_ID))
      .set(COOKIE_HEADER, courierCookies)
      .expect(HttpStatus.BAD_REQUEST);
    await getApi(app, clientPath).set(COOKIE_HEADER, clientCookies).expect(HttpStatus.BAD_REQUEST);
  });
});
