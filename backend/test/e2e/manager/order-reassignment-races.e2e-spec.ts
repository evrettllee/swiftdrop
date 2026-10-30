import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { addCourierSession } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi, sortedStatuses } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { postReassign, postRestartAssignment } from '@test/support/manager-assignment';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

type Session = { courierProfileId: number; cookies: string };

const THIRD_COURIER_ACCOUNT = {
  ...SECOND_COURIER_ACCOUNT,
  firstName: 'Игорь',
  email: 'courier3@example.com',
  phone: '+375337778899',
};
const FOREIGN_ORDER = [HttpStatus.NOT_FOUND, HttpStatus.CONFLICT];
const CONFLICT_PAIR = [HttpStatus.OK, HttpStatus.CONFLICT];

describe('Reassignment and restart under concurrent changes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let orderId: number;
  let courier: Session;
  let other: Session;
  const getRoute = jest.fn();
  const isAvailable = jest.fn(() => true);

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute, isAvailable } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function readOrder() {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    return order;
  }

  function readHistory() {
    return db
      .select({ status: orderStatusHistory.status, changedBy: orderStatusHistory.changedBy })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(asc(orderStatusHistory.statusHistoryId));
  }

  it('should let either the pickup by the old courier or the reassignment win, never both', async () => {
    const path = COURIER_ORDERS_ROUTES.PICKUP.replace(ORDER_ID_ROUTE_PARAM, String(orderId));

    const [pickup, reassign] = await Promise.all([
      postApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${path}`).set(COOKIE_HEADER, courier.cookies),
      postReassign(app, manager, orderId, {
        courierId: other.courierProfileId,
        expectedCourierId: courier.courierProfileId,
      }),
    ]);
    const order = await readOrder();

    if (reassign.status === HttpStatus.OK) {
      expect(FOREIGN_ORDER).toContain(pickup.status);
      expect(order).toMatchObject({
        status: ORDER_STATUS.COURIER_ASSIGNED,
        courierId: other.courierProfileId,
        otpCode: null,
      });
    } else {
      expect(pickup.status).toBe(HttpStatus.OK);
      expect(reassign.body).toMatchObject({ code: 'ORDER_NOT_REASSIGNABLE' });
      expect(order).toMatchObject({
        status: ORDER_STATUS.PICKED_UP,
        courierId: courier.courierProfileId,
      });
    }
  });

  it('should let either the reassignment or the restart win when both expect the same courier', async () => {
    const before = (await readHistory()).length;
    const expectedCourierId = courier.courierProfileId;

    const [reassign, restart] = await Promise.all([
      postReassign(app, manager, orderId, { courierId: other.courierProfileId, expectedCourierId }),
      postRestartAssignment(app, manager, orderId, { expectedCourierId }),
    ]);
    const history = await readHistory();
    const order = await readOrder();

    expect(sortedStatuses([reassign, restart])).toEqual(CONFLICT_PAIR);
    expect(history).toHaveLength(before + 1);

    if (reassign.status === HttpStatus.OK) {
      expect(restart.body).toMatchObject({
        code: 'COURIER_CHANGED',
        currentCourierId: other.courierProfileId,
      });
      expect(order).toMatchObject({
        status: ORDER_STATUS.COURIER_ASSIGNED,
        courierId: other.courierProfileId,
        assignmentRound: 1,
      });
    } else {
      expect(reassign.body).toMatchObject({ code: 'ORDER_NOT_REASSIGNABLE' });
      expect(order).toMatchObject({
        status: ORDER_STATUS.CONFIRMED,
        courierId: null,
        assignmentRound: 2,
      });
    }

    expect(history.at(-1)?.status).toBe(order.status);
  });

  it('should let only one of two reassignments from the same courier win', async () => {
    const third = await addCourierSession(app, db, THIRD_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const targets = [other.courierProfileId, third.courierProfileId];
    const before = (await readHistory()).length;

    const responses = await Promise.all(
      targets.map((courierId) =>
        postReassign(app, manager, orderId, {
          courierId,
          expectedCourierId: courier.courierProfileId,
        }),
      ),
    );
    const winner = targets[responses.findIndex((response) => response.status === HttpStatus.OK)];
    const refused = responses.find((response) => response.status === HttpStatus.CONFLICT);

    expect(sortedStatuses(responses)).toEqual(CONFLICT_PAIR);
    expect(refused?.body).toMatchObject({ code: 'COURIER_CHANGED', currentCourierId: winner });
    expect(await readOrder()).toMatchObject({
      status: ORDER_STATUS.COURIER_ASSIGNED,
      courierId: winner,
    });
    expect(await readHistory()).toHaveLength(before + 1);
  });
});
