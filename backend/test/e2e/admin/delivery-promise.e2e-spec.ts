import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '@/modules/assignment/constants/assignment.constants';
import { promisedDeliveryAt } from '@/modules/assignment/utils/delivery-promise';
import { createTestApp } from '@test/support/app';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { postAssign, postReassign } from '@test/support/manager-assignment';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Promised delivery time (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let courier: { courierProfileId: number; cookies: string };
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
  });

  afterAll(async () => {
    await app.close();
  });

  async function readOrder() {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    return order;
  }

  async function expectPromiseOf(assign: () => Promise<unknown>): Promise<Date> {
    const { estimatedMinutes } = await readOrder();
    const before = new Date();
    await assign();
    const after = new Date();
    const { promisedDeliveryAt: promised } = await readOrder();

    expect(promised).toBeInstanceOf(Date);
    expect(promised?.getTime()).toBeGreaterThanOrEqual(
      promisedDeliveryAt(before, estimatedMinutes)?.getTime() ?? 0,
    );
    expect(promised?.getTime()).toBeLessThanOrEqual(
      promisedDeliveryAt(after, estimatedMinutes)?.getTime() ?? 0,
    );
    expect((promised?.getTime() ?? 1) % (5 * 60_000)).toBe(0);

    return promised ?? new Date(0);
  }

  it('should promise the time when the courier accepts the offer', async () => {
    const offerId = await insertOffer(db, orderId, courier.courierProfileId);
    const path = COURIER_OFFERS_ROUTES.ACCEPT.replace(OFFER_ID_ROUTE_PARAM, String(offerId));

    await expectPromiseOf(() =>
      postApi(app, `${COURIER_OFFERS_ROUTES.BASE}/${path}`)
        .set(COOKIE_HEADER, courier.cookies)
        .expect(HttpStatus.OK),
    );
  });

  it('should promise the time on a manual assignment and keep it on a reassignment', async () => {
    const manager = await createManager(app, db);
    const other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    const promised = await expectPromiseOf(() =>
      postAssign(app, manager, orderId, courier.courierProfileId).expect(HttpStatus.OK),
    );
    await postReassign(app, manager, orderId, {
      courierId: other.courierProfileId,
      expectedCourierId: courier.courierProfileId,
    }).expect(HttpStatus.OK);

    expect((await readOrder()).promisedDeliveryAt).toEqual(promised);
  });

  it('should promise nothing for an order without an estimate', async () => {
    const manager = await createManager(app, db);
    await db.update(orders).set({ estimatedMinutes: null }).where(eq(orders.orderId, orderId));

    await postAssign(app, manager, orderId, courier.courierProfileId).expect(HttpStatus.OK);

    expect((await readOrder()).promisedDeliveryAt).toBeNull();
  });
});
