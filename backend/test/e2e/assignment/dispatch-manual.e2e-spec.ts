import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers, orderStatusHistory } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  CANDIDATE_SEARCH_TIMEOUT_MS,
  MAX_OFFERS_PER_ORDER,
} from '@/modules/assignment/constants/assignment.constants';
import { AssignmentRoundService } from '@/modules/assignment/services/assignment-round.service';
import { OrderDispatchService } from '@/modules/assignment/services/order-dispatch.service';
import { createTestApp } from '@test/support/app';
import {
  addCourierOnShift,
  insertBareCouriers,
  insertOffer,
  recordConfirmation,
} from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, placeCourierAt } from '@test/support/couriers';
import { MINSK_PICKUP, MOSCOW } from '@test/support/fixtures';
import { placeOrders, readOrderStatus, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const MARGIN_MS = 1000;

describe('Order dispatch to manual assignment (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let courierId: number;
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
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    courierId = await addCourierOnShift(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should move the order to manual assignment when the offers limit is reached', async () => {
    for (const bareId of await insertBareCouriers(db, MAX_OFFERS_PER_ORDER)) {
      await insertOffer(db, orderId, bareId, { status: ORDER_OFFER_STATUS.DECLINED });
    }

    await app.get(OrderDispatchService).dispatch(orderId);

    const history = await db
      .select({ status: orderStatusHistory.status, changedBy: orderStatusHistory.changedBy })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId));
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    expect(history).toContainEqual({
      status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
      changedBy: null,
    });
    expect(await db.select().from(orderOffers)).toHaveLength(MAX_OFFERS_PER_ORDER);
  });

  it('should move the order to manual assignment when nobody is near for too long', async () => {
    await placeCourierAt(db, courierId, MOSCOW);
    const confirmedAt = new Date(Date.now() - CANDIDATE_SEARCH_TIMEOUT_MS - MARGIN_MS);
    await recordConfirmation(db, orderId, confirmedAt);

    await app.get(AssignmentRoundService).run();

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
  });

  it('should keep the order waiting when nobody is near yet', async () => {
    await placeCourierAt(db, courierId, MOSCOW);
    await recordConfirmation(db, orderId, new Date());

    await app.get(AssignmentRoundService).run();

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
    expect(await db.select().from(orderOffers)).toHaveLength(0);
  });
});
