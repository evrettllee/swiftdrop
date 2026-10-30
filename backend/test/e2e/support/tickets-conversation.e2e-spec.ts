import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SUPPORT_ROUTES } from '@/modules/support/constants/support.constants';
import { SupportMessageWriterService } from '@/modules/support/services/support-message-writer.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import {
  getTicket,
  getTicketMessages,
  getTickets,
  postTicket,
  postTicketAction,
  postTicketMessage,
} from '@test/support/support-tickets';
import { MANAGER_ACCOUNT } from '@test/support/users';

const STAFF_REPLY = 'Ответ поддержки. '.repeat(10);

describe('Support ticket list and conversation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: string;
  let ids: { old: number; payment: number; closed: number };
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    client = (await registerUser(app)).cookies;
    await createManager(app, db);
    const create = async (body: object) =>
      (await postTicket(app, client, body).expect(HttpStatus.CREATED)).body.id as number;
    ids = {
      old: await create({ topic: 'other', subject: 'Старый вопрос', message: 'Первое' }),
      payment: await create({ topic: 'payment', message: 'Деньги списались дважды' }),
      closed: await create({ topic: 'account', message: 'Смена почты' }),
    };
    const [staff] = await db.select().from(users).where(eq(users.email, MANAGER_ACCOUNT.email));
    const writer = app.get(SupportMessageWriterService);
    await db.transaction((tx) =>
      writer.write(tx, {
        ticketId: ids.old,
        senderId: staff.userId,
        text: STAFF_REPLY,
        fromStaff: true,
      }),
    );
    await postTicketAction(app, client, SUPPORT_ROUTES.CLOSE, ids.closed).expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should count the tabs by the total of the first page and go on by the cursor', async () => {
    const open = await getTickets(app, client, { status: 'open', limit: 1 }).expect(HttpStatus.OK);
    const next = await getTickets(app, client, {
      status: 'open',
      limit: 1,
      cursor: open.body.nextCursor,
    }).expect(HttpStatus.OK);
    const closed = await getTickets(app, client, { status: 'closed', limit: 1 }).expect(
      HttpStatus.OK,
    );

    expect(open.body.total).toBe(2);
    expect(open.body.items.map((item: { id: number }) => item.id)).toEqual([ids.old]);
    expect(next.body.items.map((item: { id: number }) => item.id)).toEqual([ids.payment]);
    expect(next.body.nextCursor).toBeNull();
    expect(closed.body.total).toBe(1);
    expect(closed.body.items[0]).toMatchObject({
      id: ids.closed,
      status: 'closed',
      awaitingStaff: false,
    });
  });

  it('should show the staff reply cut to 120 characters and count it unread', async () => {
    const { body } = await getTickets(app, client).expect(HttpStatus.OK);

    expect(body.items[0]).toMatchObject({
      id: ids.old,
      title: 'Старый вопрос',
      awaitingStaff: false,
      unreadCount: 1,
      order: null,
      lastMessage: { text: STAFF_REPLY.slice(0, 120), fromStaff: true },
    });
  });

  it('should give the messages newest first, the staff named by the first name only', async () => {
    const first = await getTicketMessages(app, client, ids.old, { limit: 1 }).expect(HttpStatus.OK);
    const rest = await getTicketMessages(app, client, ids.old, {
      limit: 1,
      cursor: first.body.nextCursor,
    }).expect(HttpStatus.OK);

    expect(first.body.items).toEqual([
      expect.objectContaining({
        text: STAFF_REPLY,
        fromStaff: true,
        authorName: 'Елена, поддержка',
        isRead: false,
      }),
    ]);
    expect(JSON.stringify(first.body)).not.toMatch(/Жукова|manager@example.com|\+375297778899/);
    expect(rest.body.items).toEqual([
      expect.objectContaining({ text: 'Первое', fromStaff: false, authorName: 'Иван Петров' }),
    ]);
  });

  it('should mark the staff messages read', async () => {
    const read = await postTicketAction(app, client, SUPPORT_ROUTES.READ, ids.old).expect(
      HttpStatus.OK,
    );
    const details = await getTicket(app, client, ids.old).expect(HttpStatus.OK);

    expect(read.body).toEqual({ readCount: 1, unreadCount: 0 });
    expect(details.body.unreadCount).toBe(0);
  });

  it('should take a reply to an open ticket and refuse one to a closed ticket', async () => {
    const sent = await postTicketMessage(app, client, ids.old, ' Спасибо ').expect(
      HttpStatus.CREATED,
    );
    const details = await getTicket(app, client, ids.old).expect(HttpStatus.OK);
    const refused = await postTicketMessage(app, client, ids.closed, 'Ещё').expect(
      HttpStatus.CONFLICT,
    );

    expect(sent.body.message).toMatchObject({ text: 'Спасибо', fromStaff: false });
    expect(details.body).toMatchObject({
      awaitingStaff: true,
      lastMessageAt: sent.body.message.createdAt,
    });
    expect(refused.body).toMatchObject({ code: 'TICKET_CLOSED' });
  });

  it('should close a ticket once and answer the same on a second close', async () => {
    const first = await getTicket(app, client, ids.closed).expect(HttpStatus.OK);
    const again = await postTicketAction(app, client, SUPPORT_ROUTES.CLOSE, ids.closed).expect(
      HttpStatus.OK,
    );

    expect(again.body).toEqual(first.body);
    expect(again.body.closedAt).not.toBeNull();
  });
});
