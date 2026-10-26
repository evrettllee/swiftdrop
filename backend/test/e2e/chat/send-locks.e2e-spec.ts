import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { orderParticipant } from '@/common/database/order-participant';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DB_LOCK_TIMEOUT_MS, DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { messages, orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CHAT_ERROR_MESSAGES } from '@/modules/chat/constants/chat.constants';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { countOrderMessages, placeConfirmedOrder, sendChatMessage } from '@test/support/chat';
import { LOCK_TEST_MARGIN_MS } from '@test/support/constants';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { commitOnceBlocked, holdOrder, whileRowsAreHeld } from '@test/support/locks';
import { readOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const RIGHT_CODE = '4821';

// The message and the end of the order in a fixed order: one side holds the order row, the other
// is shown to wait for it, then the first commits.
describe('Chat messages and the order row lock (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientUserId: number;
  let courierCookies: string;
  let orderId: number;
  const getRoute = jest.fn();

  function deliver() {
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.DELIVER.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return postApi(app, path).set(COOKIE_HEADER, courierCookies).send({ code: RIGHT_CODE });
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    clientUserId = client.body.user.userId;
    orderId = await placeConfirmedOrder(app, db, client.cookies);
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    courierCookies = courier.cookies;
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.IN_TRANSIT);
    await db.update(orders).set({ otpCode: RIGHT_CODE }).where(eq(orders.orderId, orderId));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a message that waited for a delivery committed first', async () => {
    const sent = await commitOnceBlocked(
      db,
      (tx) =>
        tx
          .update(orders)
          .set({ status: ORDER_STATUS.DELIVERED })
          .where(eq(orders.orderId, orderId)),
      () => sendChatMessage(app, courierCookies, orderId),
    );

    expect(sent.status).toBe(HttpStatus.CONFLICT);
    expect(sent.body.message).toBe(CHAT_ERROR_MESSAGES.CHAT_CLOSED);
    expect(await countOrderMessages(db, orderId)).toBe(0);
  });

  // The holding transaction does what a send does: the same locked check, then the insert.
  it('should keep a message committed first and deliver the order after it', async () => {
    const delivered = await commitOnceBlocked(
      db,
      async (tx) => {
        const actor = { role: ROLE.CLIENT, userId: clientUserId } as const;
        const participant = await orderParticipant(tx, orderId, actor, { lockOrder: true });

        if (!participant?.counterpartUserId) {
          throw new Error(`Order ${orderId} has no courier to write to`);
        }

        await tx.insert(messages).values({
          orderId,
          senderId: clientUserId,
          receiverId: participant.counterpartUserId,
          content: 'Я дома',
        });
      },
      deliver,
    );

    expect(delivered.status).toBe(HttpStatus.OK);
    expect(await countOrderMessages(db, orderId)).toBe(1);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.DELIVERED);
  });

  it(
    'should answer 409 and save nothing when the order row stays held past the lock timeout',
    async () => {
      const sent = await whileRowsAreHeld(db, holdOrder(orderId), () =>
        sendChatMessage(app, courierCookies, orderId),
      );

      expect(sent.status).toBe(HttpStatus.CONFLICT);
      expect(sent.body.message).toBe(CHAT_ERROR_MESSAGES.BUSY);
      expect(await countOrderMessages(db, orderId)).toBe(0);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );
});
