import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers, orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { addCourierSession, insertBareCouriers, insertOffer } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager, getManagerOrder } from '@test/support/manager';
import { postRestartAssignment } from '@test/support/manager-assignment';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const REASON = 'Повторить поиск после обеда';
const NO_COURIER = { expectedCourierId: null };

describe('Restart of the courier search by a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let orderIds: number[];
  let courier: { courierProfileId: number; cookies: string };
  const getRoute = jest.fn();
  const isAvailable = jest.fn(() => true);

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute, isAvailable } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    orderIds = await placeOrders(app, cookies, 2);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function readOrder(orderId: number) {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    return order;
  }

  function readOffers(orderId: number) {
    return db
      .select({
        courierId: orderOffers.courierId,
        status: orderOffers.status,
        round: orderOffers.round,
      })
      .from(orderOffers)
      .where(eq(orderOffers.orderId, orderId))
      .orderBy(asc(orderOffers.offerId));
  }

  it('should open a new round at once and offer the order again to a courier who declined it', async () => {
    const [orderId] = orderIds;
    await setOrderStatus(db, orderId, ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await insertOffer(db, orderId, courier.courierProfileId, { status: 'declined' });
    for (const bareId of await insertBareCouriers(db, 4)) {
      await insertOffer(db, orderId, bareId, { status: 'declined' });
    }

    const response = await postRestartAssignment(app, manager, orderId, {
      expectedCourierId: null,
      reason: REASON,
    }).expect(HttpStatus.OK);
    const details = await getManagerOrder(app, manager, orderId).expect(HttpStatus.OK);

    expect(response.body).toEqual({ orderId, status: ORDER_STATUS.CONFIRMED });
    expect(await readOrder(orderId)).toMatchObject({
      status: ORDER_STATUS.CONFIRMED,
      assignmentRound: 2,
    });
    expect((await readOffers(orderId)).at(-1)).toEqual({
      courierId: courier.courierProfileId,
      status: 'pending',
      round: 2,
    });
    expect((details.body as { history: unknown[] }).history.at(-1)).toMatchObject({
      status: ORDER_STATUS.CONFIRMED,
      actor: 'staff',
      comment: REASON,
    });
  });

  it('should take the order from its courier before the pickup and search again', async () => {
    const [orderId] = orderIds;
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
    await insertOffer(db, orderId, courier.courierProfileId, { status: 'accepted' });

    await postRestartAssignment(app, manager, orderId, {
      expectedCourierId: courier.courierProfileId,
    }).expect(HttpStatus.OK);

    expect(await readOrder(orderId)).toMatchObject({
      status: ORDER_STATUS.CONFIRMED,
      courierId: null,
      assignmentRound: 2,
    });
    expect((await readOffers(orderId)).map(({ status, round }) => ({ status, round }))).toEqual([
      { status: 'accepted', round: 1 },
      { status: 'pending', round: 2 },
    ]);
  });

  it('should refuse an order that is searching, picked up or finished, and a missing one', async () => {
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.CONFIRMED);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.PICKED_UP);

    const refusals = [
      await postRestartAssignment(app, manager, orderIds[0], NO_COURIER),
      await postRestartAssignment(app, manager, orderIds[1], NO_COURIER),
    ];

    for (const refusal of refusals) {
      expect(refusal.status).toBe(HttpStatus.CONFLICT);
      expect(refusal.body).toMatchObject({ code: 'ORDER_NOT_RESTARTABLE' });
    }

    await postRestartAssignment(app, manager, orderIds[1] + 1000, NO_COURIER).expect(
      HttpStatus.NOT_FOUND,
    );
    expect((await readOrder(orderIds[0])).assignmentRound).toBe(1);
  });

  it.each([
    [{ ...NO_COURIER, reason: '' }],
    [{ ...NO_COURIER, reason: 7 }],
    [{ ...NO_COURIER, courierId: 1 }],
    [{ reason: 'Нет ответа' }],
    [{}],
  ])('should refuse the body %j with 400', async (body) => {
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);

    await postRestartAssignment(app, manager, orderIds[0], body).expect(HttpStatus.BAD_REQUEST);
  });
});
