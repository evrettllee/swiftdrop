import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SUPPORT_STAFF_ROUTES } from '@/modules/support/constants/support-staff.constants';
import { SUPPORT_ROUTES } from '@/modules/support/constants/support.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { COURIER_ACCOUNT, createCourier } from '@test/support/couriers';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import {
  getStaffCounts,
  getStaffMessages,
  getStaffTicket,
  getStaffTickets,
  getTicketMessages,
  postStaffAction,
  postStaffMessage,
  postTicket,
  postTicketAction,
} from '@test/support/support-tickets';

type Item = { id: number; waitingSec: number | null };

describe('Support queue for the staff (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: string;
  let courier: string;
  let manager: string;
  let ids: { payment: number; app: number; answered: number; closed: number };
  const getRoute = jest.fn();
  const idsOf = (body: { items: Item[] }) => body.items.map((item) => item.id);

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    client = (await registerUser(app)).cookies;
    courier = await createCourier(app, db);
    manager = await createManager(app, db);
    const create = async (cookies: string, body: object) =>
      (await postTicket(app, cookies, body).expect(HttpStatus.CREATED)).body.id as number;
    ids = {
      payment: await create(client, { topic: 'payment', message: 'Двойное списание' }),
      app: await create(courier, { topic: 'app', message: 'Карта не грузится' }),
      answered: await create(client, { topic: 'other', subject: 'Вопрос', message: 'Как?' }),
      closed: await create(client, { topic: 'account', message: 'Смена почты' }),
    };
    await postStaffMessage(app, manager, ids.answered, 'Вот так').expect(HttpStatus.CREATED);
    await postTicketAction(app, client, SUPPORT_ROUTES.CLOSE, ids.closed).expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should keep a client and a courier out with 403 and a guest with 401', async () => {
    for (const cookies of [client, courier]) {
      await getStaffTickets(app, cookies).expect(HttpStatus.FORBIDDEN);
      await getStaffCounts(app, cookies).expect(HttpStatus.FORBIDDEN);
      await getStaffTicket(app, cookies, ids.payment).expect(HttpStatus.FORBIDDEN);
      await getStaffMessages(app, cookies, ids.payment).expect(HttpStatus.FORBIDDEN);
      await postStaffMessage(app, cookies, ids.payment, 'Я сам').expect(HttpStatus.FORBIDDEN);
      await postStaffAction(app, cookies, SUPPORT_STAFF_ROUTES.CLOSE, ids.payment).expect(
        HttpStatus.FORBIDDEN,
      );
    }

    await getStaffTickets(app, null).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should count and list the awaiting tickets, the longest waiting first', async () => {
    const counts = await getStaffCounts(app, manager).expect(HttpStatus.OK);
    const { body } = await getStaffTickets(app, manager).expect(HttpStatus.OK);

    expect(counts.body).toEqual({ awaiting: 2, open: 3 });
    expect(idsOf(body)).toEqual([ids.payment, ids.app]);
    expect(body).toMatchObject({ total: 2, page: 1, limit: 20, until: expect.any(Number) });
    expect(body.items[0]).toMatchObject({
      waitingSec: expect.any(Number),
      author: { name: 'Иван Петров', role: 'client' },
      lastMessage: { text: 'Двойное списание', fromStaff: false },
    });
    expect(body.items[0].author).not.toHaveProperty('phone');
  });

  it.each([
    [{ view: 'open' }, ['answered', 'app', 'payment']],
    [{ view: 'closed' }, ['closed']],
    [{ authorRole: 'courier' }, ['app']],
    [{ view: 'open', topic: 'payment,other' }, ['answered', 'payment']],
    [{ view: 'open', q: COURIER_ACCOUNT.phone }, ['app']],
    [{ view: 'open', q: 'Петров' }, ['answered', 'payment']],
  ] as const)('should filter the queue by %o', async (query, expected) => {
    const { body } = await getStaffTickets(app, manager, query).expect(HttpStatus.OK);

    expect(idsOf(body)).toEqual(expected.map((key) => ids[key]));
  });

  it('should find a ticket by its number', async () => {
    const { body } = await getStaffTickets(app, manager, { view: 'open', q: String(ids.app) });

    expect(idsOf(body)).toEqual([ids.app]);
  });

  it('should give the details with the phone and the messages named for the staff', async () => {
    const details = await getStaffTicket(app, manager, ids.answered).expect(HttpStatus.OK);
    const { body } = await getStaffMessages(app, manager, ids.answered).expect(HttpStatus.OK);

    expect(details.body).toMatchObject({
      awaitingStaff: false,
      waitingSec: null,
      author: { name: 'Иван Петров', phone: '+375291234567' },
      closedBy: null,
    });
    expect(body.items.map((message: { authorName: string }) => message.authorName)).toEqual([
      'Елена Ж.',
      'Иван Петров',
    ]);
  });

  it('should mark the author messages read for the author to see', async () => {
    const read = await postStaffAction(app, manager, SUPPORT_STAFF_ROUTES.READ, ids.payment);
    const { body } = await getTicketMessages(app, client, ids.payment).expect(HttpStatus.OK);

    expect(read.body).toEqual({ readCount: 1, unreadCount: 0 });
    expect(body.items[0]).toMatchObject({ fromStaff: false, isRead: true });
  });

  it('should refuse a reply to a closed ticket and close a ticket once', async () => {
    const refused = await postStaffMessage(app, manager, ids.closed, 'Поздно');
    const first = await postStaffAction(app, manager, SUPPORT_STAFF_ROUTES.CLOSE, ids.answered);
    const again = await postStaffAction(app, manager, SUPPORT_STAFF_ROUTES.CLOSE, ids.answered);
    const closedByAuthor = await getStaffTicket(app, manager, ids.closed);

    expect(refused.status).toBe(HttpStatus.CONFLICT);
    expect(refused.body).toMatchObject({ code: 'TICKET_CLOSED' });
    expect(first.body).toMatchObject({
      status: 'closed',
      closedBy: { role: 'staff', name: 'Елена Ж.' },
    });
    expect(again.body).toEqual(first.body);
    expect(closedByAuthor.body.closedBy).toEqual({ role: 'author', name: 'Иван Петров' });
  });
});
