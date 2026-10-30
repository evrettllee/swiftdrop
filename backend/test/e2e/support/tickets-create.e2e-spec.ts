import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { messages, orderStatusHistory, supportTickets, users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SUPPORT_ROUTES } from '@/modules/support/constants/support.constants';
import { insertOffer } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import { createTestApp } from '@test/support/app';
import {
  assignOrder,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
  SECOND_COURIER_ACCOUNT,
} from '@test/support/couriers';
import { sortedStatuses } from '@test/support/http';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { postTicket, postTicketAction } from '@test/support/support-tickets';

const problem = (orderId: number) => ({ topic: 'order_problem', orderId, message: 'Где курьер?' });

describe('Creating support tickets (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: string;
  let orderIds: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    client = (await registerUser(app)).cookies;
    orderIds = await placeOrders(app, client, 4);
  });

  afterAll(async () => {
    await app.close();
  });

  async function courierSession(account = COURIER_ACCOUNT) {
    const cookies = await createCourier(app, db, account);
    await getCourierMe(app, cookies).expect(HttpStatus.OK);
    const profileId = await findCourierProfileId(db, account.email);
    const [user] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.email, account.email));

    return { cookies, profileId, userId: user.userId };
  }

  it('should open a ticket with its first message and wait for staff', async () => {
    const { body } = await postTicket(app, client, problem(orderIds[0])).expect(HttpStatus.CREATED);
    const saved = await db.select().from(messages).where(eq(messages.ticketId, body.id));

    expect(body).toMatchObject({
      title: 'Проблема с заказом',
      topic: 'order_problem',
      status: 'open',
      awaitingStaff: true,
      order: { orderId: orderIds[0], status: 'pending' },
      lastMessage: { text: 'Где курьер?', fromStaff: false },
      unreadCount: 0,
      closedAt: null,
    });
    expect(body.order.deliveryAddress).toEqual(expect.any(String));
    expect(saved).toHaveLength(1);
    expect(saved[0].sentAt.toISOString()).toBe(body.lastMessageAt);
  });

  it('should answer 404 to a foreign order and to a missing one alike', async () => {
    const other = (
      await registerUser(app, {
        ...COURIER_ACCOUNT,
        email: 'other@example.com',
        phone: '+375290000001',
      })
    ).cookies;

    const foreign = await postTicket(app, other, problem(orderIds[0])).expect(HttpStatus.NOT_FOUND);
    const missing = await postTicket(app, other, problem(999_999)).expect(HttpStatus.NOT_FOUND);

    expect(foreign.body).toEqual(missing.body);
  });

  it('should let a courier write about a current, an accepted or a handled order only', async () => {
    const second = await courierSession(SECOND_COURIER_ACCOUNT);
    const courier = await courierSession();
    await assignOrder(db, orderIds[0], courier.profileId, ORDER_STATUS.COURIER_ASSIGNED);
    await assignOrder(db, orderIds[1], second.profileId, ORDER_STATUS.COURIER_ASSIGNED);
    await insertOffer(db, orderIds[1], courier.profileId, { status: ORDER_OFFER_STATUS.ACCEPTED });
    await db
      .insert(orderStatusHistory)
      .values({ orderId: orderIds[2], status: ORDER_STATUS.PICKED_UP, changedBy: courier.userId });

    for (const orderId of orderIds.slice(0, 3)) {
      await postTicket(app, courier.cookies, problem(orderId)).expect(HttpStatus.CREATED);
    }

    await postTicket(app, courier.cookies, problem(orderIds[3])).expect(HttpStatus.NOT_FOUND);
  });

  it('should let only one of two tickets about one order open at once', async () => {
    const responses = await Promise.all(
      [0, 1].map(() => postTicket(app, client, problem(orderIds[0]))),
    );
    const created = responses.find((response) => response.status === HttpStatus.CREATED);
    const refused = responses.find((response) => response.status === HttpStatus.CONFLICT);
    const tickets = await db.select().from(supportTickets);

    expect(sortedStatuses(responses)).toEqual([HttpStatus.CREATED, HttpStatus.CONFLICT]);
    expect(refused?.body).toMatchObject({
      code: 'TICKET_ALREADY_OPEN',
      ticketId: created?.body.id,
    });
    expect(tickets).toHaveLength(1);
    expect(await db.select().from(messages)).toHaveLength(1);
  });

  it('should open a new ticket about the order once the old one is closed', async () => {
    const first = await postTicket(app, client, problem(orderIds[0])).expect(HttpStatus.CREATED);
    await postTicketAction(app, client, SUPPORT_ROUTES.CLOSE, first.body.id).expect(HttpStatus.OK);

    await postTicket(app, client, problem(orderIds[0])).expect(HttpStatus.CREATED);
  });
});
