import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { addCourierSession } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { getChatHistory, insertOrderMessages, sendChatMessage } from '@test/support/chat';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getApi, postApi } from '@test/support/http';
import { createManager, getManagerOrder } from '@test/support/manager';
import { postReassign, postRestartAssignment } from '@test/support/manager-assignment';
import { type Cookies, placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

type Session = { courierProfileId: number; cookies: string };

const REASON = 'Курьер сломал велосипед';

describe('Reassignment of a courier before the pickup (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let manager: string;
  let orderIds: number[];
  let courier: Session;
  let other: Session;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: client } = await registerUser(app));
    orderIds = await placeOrders(app, client, 2);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.CONFIRMED);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderIds[0], courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  function courierGet(session: Session, path: string) {
    return getApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${path}`).set(COOKIE_HEADER, session.cookies);
  }

  function pickUp(session: Session) {
    const path = COURIER_ORDERS_ROUTES.PICKUP.replace(ORDER_ID_ROUTE_PARAM, String(orderIds[0]));

    return postApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${path}`).set(
      COOKIE_HEADER,
      session.cookies,
    );
  }

  async function readOrder() {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderIds[0]));

    return order;
  }

  it('should let a manager and an admin in, and keep a client, a courier and a guest out', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
    const body = { courierId: other.courierProfileId, expectedCourierId: courier.courierProfileId };

    for (const [cookies, status] of [
      [client, HttpStatus.FORBIDDEN],
      [courier.cookies, HttpStatus.FORBIDDEN],
      [null, HttpStatus.UNAUTHORIZED],
    ] as const) {
      await postReassign(app, cookies, orderIds[0], body).expect(status);
      await postRestartAssignment(app, cookies, orderIds[0], body).expect(status);
    }

    await postReassign(app, admin, orderIds[0], body).expect(HttpStatus.OK);
  });

  it('should change only the courier and write the reason to the history as staff', async () => {
    const before = await readOrder();

    const response = await postReassign(app, manager, orderIds[0], {
      courierId: other.courierProfileId,
      expectedCourierId: courier.courierProfileId,
      reason: `  ${REASON}  `,
    }).expect(HttpStatus.OK);
    const after = await readOrder();
    const details = await getManagerOrder(app, manager, orderIds[0]).expect(HttpStatus.OK);

    expect(response.body).toEqual({ orderId: orderIds[0], courierId: other.courierProfileId });
    expect(after).toMatchObject({
      status: ORDER_STATUS.COURIER_ASSIGNED,
      courierId: other.courierProfileId,
      statusChangedAt: before.statusChangedAt,
    });
    expect((details.body as { history: unknown[] }).history.at(-1)).toMatchObject({
      status: ORDER_STATUS.COURIER_ASSIGNED,
      actor: 'staff',
      comment: REASON,
    });
  });

  it('should close the order, its chat and its route to the old courier and open them to the new one', async () => {
    await insertOrderMessages(db, orderIds[0], [{ from: ROLE.CLIENT }, { from: ROLE.COURIER }]);

    await postReassign(app, manager, orderIds[0], {
      courierId: other.courierProfileId,
      expectedCourierId: courier.courierProfileId,
    }).expect(HttpStatus.OK);

    expect((await courierGet(courier, COURIER_ORDERS_ROUTES.CURRENT)).body).toEqual({
      order: null,
    });
    await courierGet(courier, COURIER_ORDERS_ROUTES.CURRENT_ROUTE).expect(HttpStatus.NOT_FOUND);
    await getChatHistory(app, courier.cookies, orderIds[0]).expect(HttpStatus.NOT_FOUND);
    await sendChatMessage(app, courier.cookies, orderIds[0]).expect(HttpStatus.NOT_FOUND);
    await pickUp(courier).expect(HttpStatus.NOT_FOUND);

    const current = await courierGet(other, COURIER_ORDERS_ROUTES.CURRENT).expect(HttpStatus.OK);
    const chat = await getChatHistory(app, other.cookies, orderIds[0]).expect(HttpStatus.OK);
    await courierGet(other, COURIER_ORDERS_ROUTES.CURRENT_ROUTE).expect(HttpStatus.OK);

    expect(current.body.order).toMatchObject({ orderId: orderIds[0] });
    expect((chat.body as { items: unknown[] }).items).toHaveLength(2);
  });

  it('should refuse a stale expected courier, the same courier, a picked up order and a busy courier', async () => {
    await assignOrder(db, orderIds[1], other.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
    const expectedCourierId = courier.courierProfileId;
    const same = { courierId: courier.courierProfileId, expectedCourierId };
    const busy = { courierId: other.courierProfileId, expectedCourierId };
    const stale = { courierId: other.courierProfileId, expectedCourierId: other.courierProfileId };

    const refusals = [
      await postReassign(app, manager, orderIds[0], stale).expect(HttpStatus.CONFLICT),
      await postReassign(app, manager, orderIds[0], same).expect(HttpStatus.CONFLICT),
      await postReassign(app, manager, orderIds[0], busy).expect(HttpStatus.CONFLICT),
    ];
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.PICKED_UP);
    const pickedUp = await postReassign(app, manager, orderIds[0], busy);

    expect(refusals.map((response) => response.body)).toEqual([
      expect.objectContaining({ code: 'COURIER_CHANGED', currentCourierId: expectedCourierId }),
      expect.objectContaining({ code: 'SAME_COURIER' }),
      expect.objectContaining({ code: 'COURIER_NOT_AVAILABLE', reason: 'busy' }),
    ]);
    expect(pickedUp.body).toMatchObject({ statusCode: 409, code: 'ORDER_NOT_REASSIGNABLE' });
    await postReassign(app, manager, orderIds[1] + 1000, busy).expect(HttpStatus.NOT_FOUND);
  });

  it.each([
    [{ reason: '   ' }],
    [{ reason: 'х'.repeat(501) }],
    [{ comment: 'x' }],
    [{ expectedCourierId: undefined }],
    [{ expectedCourierId: '1' }],
  ])('should refuse the body %j with 400', async (extra) => {
    const body = { courierId: 1, expectedCourierId: courier.courierProfileId, ...extra };

    await postReassign(app, manager, orderIds[0], body).expect(HttpStatus.BAD_REQUEST);
  });
});
