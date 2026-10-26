import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS, type OrderStatus } from '../../../src/common/enums/order-status.enum';
import { ROLE } from '../../../src/common/enums/role.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { CHAT_PAGE_SIZE_DEFAULT } from '../../../src/modules/chat/constants/chat.constants';
import type { ChatHistory } from '../../../src/modules/chat/types/chat.types';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import {
  assignCourier,
  getChatHistory,
  insertOrderMessages,
  placeConfirmedOrder,
  type TestMessage,
} from '../../support/chat';
import { type Cookies, setOrderStatus } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

const FROM_CLIENT: TestMessage = { from: ROLE.CLIENT };
const FROM_COURIER: TestMessage = { from: ROLE.COURIER };
// 75 messages: two full pages of 30 and the last one of 15.
const LONG_CHAT_SIZE = 75;
const LAST_PAGE_SIZE = 15;

describe('Chat history of an order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let courierCookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  async function readHistory(cookies: Cookies, query = {}): Promise<ChatHistory> {
    const response = await getChatHistory(app, cookies, orderId, query).expect(HttpStatus.OK);

    return response.body as ChatHistory;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    ({ cookies: courierCookies } = await assignCourier(app, db, orderId));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should show both sides the same history, oldest first, without user ids', async () => {
    const ids = await insertOrderMessages(db, orderId, [FROM_CLIENT, FROM_COURIER, FROM_CLIENT]);

    const ofClient = await readHistory(clientCookies);
    const ofCourier = await readHistory(courierCookies);

    expect(ofClient.items).toEqual(ofCourier.items);
    expect(ofClient.items.map((item) => item.messageId)).toEqual(ids);
    expect(ofClient.items.map((item) => item.senderRole)).toEqual([
      ROLE.CLIENT,
      ROLE.COURIER,
      ROLE.CLIENT,
    ]);
    expect(ofClient.items[0]).toEqual({
      messageId: ids[0],
      senderRole: ROLE.CLIENT,
      content: 'Сообщение 1',
      sentAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.+Z$/),
      isRead: false,
    });
    expect(ofClient.nextBeforeId).toBeNull();
  });

  it('should page back by 30, 30 and 15 without gaps or repeats', async () => {
    const ids = await insertOrderMessages(
      db,
      orderId,
      Array.from({ length: LONG_CHAT_SIZE }, (_, index) =>
        index % 2 ? FROM_COURIER : FROM_CLIENT,
      ),
    );

    const first = await readHistory(clientCookies);
    const second = await readHistory(clientCookies, { beforeId: first.nextBeforeId });
    const third = await readHistory(clientCookies, { beforeId: second.nextBeforeId });

    expect([first, second, third].map((page) => page.items.length)).toEqual([
      CHAT_PAGE_SIZE_DEFAULT,
      CHAT_PAGE_SIZE_DEFAULT,
      LAST_PAGE_SIZE,
    ]);
    expect(first.nextBeforeId).toBe(first.items[0].messageId);
    expect(second.nextBeforeId).toBe(second.items[0].messageId);
    expect(third.nextBeforeId).toBeNull();
    expect([...third.items, ...second.items, ...first.items].map((item) => item.messageId)).toEqual(
      ids,
    );
  });

  it('should count only the unread messages to the current user', async () => {
    await insertOrderMessages(db, orderId, [
      FROM_CLIENT,
      FROM_CLIENT,
      FROM_COURIER,
      FROM_COURIER,
      FROM_COURIER,
      { from: ROLE.COURIER, isRead: true },
    ]);

    expect((await readHistory(clientCookies)).unreadCount).toBe(3);
    expect((await readHistory(courierCookies)).unreadCount).toBe(2);
  });

  it.each<[OrderStatus, boolean]>([
    [ORDER_STATUS.COURIER_ASSIGNED, true],
    [ORDER_STATUS.PICKED_UP, true],
    [ORDER_STATUS.IN_TRANSIT, true],
    [ORDER_STATUS.DELIVERED, false],
    [ORDER_STATUS.CANCELLED, false],
  ])(
    'should let both sides write in %s: %s, the history stays readable',
    async (status, canSend) => {
      await insertOrderMessages(db, orderId, [FROM_CLIENT]);
      await setOrderStatus(db, orderId, status);

      for (const cookies of [clientCookies, courierCookies]) {
        const history = await readHistory(cookies);

        expect(history.canSend).toBe(canSend);
        expect(history.items).toHaveLength(1);
      }
    },
  );
});
