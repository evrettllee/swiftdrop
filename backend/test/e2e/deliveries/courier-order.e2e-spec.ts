import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '../../../src/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { addCourierOnShift, addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '../../support/couriers';
import { MINSK_PICKUP, SMALL_PACKAGE, VALID_ORDER } from '../../support/fixtures';
import { getApi, postApi } from '../../support/http';
import { placeOrders, readOrderStatus, setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

type DeliveryAction = typeof COURIER_ORDERS_ROUTES.PICKUP | typeof COURIER_ORDERS_ROUTES.DEPART;

const FOUR_DIGITS = /^[0-9]{4}$/;
// The phone of VALID_ORDER as the order keeps it: spaces and hyphens are dropped on placing.
const RECIPIENT_PHONE = '+375291234567';

describe('Courier current order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let courierId: number;
  let cookies: string;
  const getRoute = jest.fn();

  function act(action: DeliveryAction) {
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${action.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return postApi(app, path).set(COOKIE_HEADER, cookies);
  }

  function getCurrent() {
    return getApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.CURRENT}`).set(
      COOKIE_HEADER,
      cookies,
    );
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    [orderId] = await placeOrders(app, client.cookies, 1);
    ({ courierProfileId: courierId, cookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should show the full order with the exact delivery address after the accept', async () => {
    const response = await getCurrent().expect(HttpStatus.OK);

    expect(response.body.order).toMatchObject({
      orderId,
      status: ORDER_STATUS.COURIER_ASSIGNED,
      delivery: VALID_ORDER.delivery,
      recipient: { name: VALID_ORDER.recipient.name, phone: RECIPIENT_PHONE },
      sender: { name: expect.any(String) },
      parcel: SMALL_PACKAGE,
      distanceKm: expect.any(Number),
    });
  });

  it('should show no current order when the order is delivered', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);

    const response = await getCurrent().expect(HttpStatus.OK);

    expect(response.body).toEqual({ order: null });
  });

  it('should mark the parcel picked up and create the delivery code', async () => {
    const response = await act(COURIER_ORDERS_ROUTES.PICKUP).expect(HttpStatus.OK);

    const [order] = await db
      .select({ otpCode: orders.otpCode })
      .from(orders)
      .where(eq(orders.orderId, orderId));
    expect(response.body.status).toBe(ORDER_STATUS.PICKED_UP);
    expect(order.otpCode).toMatch(FOUR_DIGITS);
  });

  it('should move the order on the way to the recipient after the pickup', async () => {
    await act(COURIER_ORDERS_ROUTES.PICKUP).expect(HttpStatus.OK);

    const response = await act(COURIER_ORDERS_ROUTES.DEPART).expect(HttpStatus.OK);

    expect(response.body.status).toBe(ORDER_STATUS.IN_TRANSIT);
  });

  it('should refuse to set off to the recipient before the pickup', async () => {
    await act(COURIER_ORDERS_ROUTES.DEPART).expect(HttpStatus.CONFLICT);

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.COURIER_ASSIGNED);
  });

  it('should refuse the pickup when the client has cancelled the order', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CANCELLED);

    await act(COURIER_ORDERS_ROUTES.PICKUP).expect(HttpStatus.CONFLICT);
  });

  it('should answer not found when the order belongs to another courier', async () => {
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, otherId, ORDER_STATUS.COURIER_ASSIGNED);

    await act(COURIER_ORDERS_ROUTES.PICKUP).expect(HttpStatus.NOT_FOUND);
  });
});
