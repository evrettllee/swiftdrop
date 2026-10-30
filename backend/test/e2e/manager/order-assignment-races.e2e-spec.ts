import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers, orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '@/modules/assignment/constants/assignment.constants';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi, sortedStatuses } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { postAssign } from '@test/support/manager-assignment';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { createUserWithRole, MANAGER_ACCOUNT } from '@test/support/users';

const SECOND_MANAGER = {
  ...MANAGER_ACCOUNT,
  email: 'manager2@example.com',
  phone: '+375297770000',
};
const CONFLICT_PAIR = [HttpStatus.OK, HttpStatus.CONFLICT];

describe('Manual assignment under concurrent changes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let orderIds: number[];
  let courier: { courierProfileId: number; cookies: string };
  let other: { courierProfileId: number; cookies: string };
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies } = await registerUser(app);
    orderIds = await placeOrders(app, cookies, 2);
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.CONFIRMED);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.CONFIRMED);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function readOrder(orderId: number) {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    return order;
  }

  it('should let either the accept or the assignment win, never both', async () => {
    const offerId = await insertOffer(db, orderIds[0], courier.courierProfileId);
    const acceptPath = `${COURIER_OFFERS_ROUTES.BASE}/${COURIER_OFFERS_ROUTES.ACCEPT.replace(OFFER_ID_ROUTE_PARAM, String(offerId))}`;

    const [accept, assign] = await Promise.all([
      postApi(app, acceptPath).set(COOKIE_HEADER, courier.cookies),
      postAssign(app, manager, orderIds[0], other.courierProfileId),
    ]);
    const order = await readOrder(orderIds[0]);
    const [offer] = await db.select().from(orderOffers).where(eq(orderOffers.offerId, offerId));

    expect(sortedStatuses([accept, assign])).toEqual(CONFLICT_PAIR);
    expect(order.status).toBe(ORDER_STATUS.COURIER_ASSIGNED);
    expect(order.courierId).toBe(
      accept.status === HttpStatus.OK ? courier.courierProfileId : other.courierProfileId,
    );
    expect(offer.status).toBe(accept.status === HttpStatus.OK ? 'accepted' : 'revoked');
  });

  it('should let one of two managers assign the order and refuse the other', async () => {
    const second = await createUserWithRole(app, db, SECOND_MANAGER, ROLE.MANAGER);

    const responses = await Promise.all([
      postAssign(app, manager, orderIds[0], courier.courierProfileId),
      postAssign(app, second, orderIds[0], other.courierProfileId),
    ]);
    const refused = responses.find((response) => response.status === HttpStatus.CONFLICT);

    expect(sortedStatuses(responses)).toEqual(CONFLICT_PAIR);
    expect(refused?.body).toMatchObject({ code: 'ORDER_NOT_ASSIGNABLE' });
    expect((await readOrder(orderIds[0])).status).toBe(ORDER_STATUS.COURIER_ASSIGNED);
  });

  it('should give one courier only one of two orders assigned at once', async () => {
    const responses = await Promise.all([
      postAssign(app, manager, orderIds[0], courier.courierProfileId),
      postAssign(app, manager, orderIds[1], courier.courierProfileId),
    ]);
    const refused = responses.find((response) => response.status === HttpStatus.CONFLICT);
    const statuses = [(await readOrder(orderIds[0])).status, (await readOrder(orderIds[1])).status];

    expect(sortedStatuses(responses)).toEqual(CONFLICT_PAIR);
    expect(refused?.body).toMatchObject({ code: 'COURIER_NOT_AVAILABLE', reason: 'busy' });
    expect(statuses.sort()).toEqual([ORDER_STATUS.CONFIRMED, ORDER_STATUS.COURIER_ASSIGNED]);
  });
});
