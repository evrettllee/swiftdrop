import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { messages } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import {
  supportMessageEventSchema,
  supportTicketEventSchema,
} from '@/modules/realtime/dto/support-events.dto';
import { SUPPORT_STAFF_ROUTES } from '@/modules/support/constants/support-staff.constants';
import { SUPPORT_ROUTES } from '@/modules/support/constants/support.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createManager } from '@test/support/manager';
import { SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  emitWithAck,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';
import {
  postStaffAction,
  postStaffMessage,
  postTicket,
  postTicketAction,
  postTicketMessage,
} from '@test/support/support-tickets';

type MessageEvent = { ticketId: number; message: { text: string; authorName: string } };

describe('Support tickets in real time (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let client: string;
  let manager: string;
  let ticketId: number;
  const sockets: Socket[] = [];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    client = (await registerUser(app)).cookies;
    manager = await createManager(app, db);
    ticketId = (
      await postTicket(app, client, { topic: 'payment', message: 'Деньги' }).expect(
        HttpStatus.CREATED,
      )
    ).body.id;
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.close());
  });

  afterAll(async () => {
    await app.close();
  });

  async function connect(cookies: string): Promise<Socket> {
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    return socket;
  }

  const join = (socket: Socket, id: number) =>
    emitWithAck(socket, SOCKET_EVENTS.TICKET_JOIN, { ticketId: id });

  it('should let the author and a manager hear each other in the ticket room', async () => {
    const author = await connect(client);
    const staff = await connect(manager);
    expect(await join(author, ticketId)).toEqual({ ok: true });
    expect(await join(staff, ticketId)).toEqual({ ok: true });

    const toAuthor = waitForEvent<MessageEvent>(author, SOCKET_EVENTS.SUPPORT_MESSAGE);
    const staffCopies = collectEvents<MessageEvent>(staff, SOCKET_EVENTS.SUPPORT_MESSAGE);
    await postStaffMessage(app, manager, ticketId, 'Проверим').expect(HttpStatus.CREATED);
    const authorEvent = await toAuthor;
    await roundTrip(staff);

    expect(authorEvent.message.authorName).toBe('Елена, поддержка');
    expect(supportMessageEventSchema.safeParse(authorEvent).success).toBe(true);
    expect(staffCopies.map((event) => event.message.authorName)).toEqual(['Елена Ж.']);

    const toStaff = waitForEvent<MessageEvent>(staff, SOCKET_EVENTS.SUPPORT_MESSAGE);
    await postTicketMessage(app, client, ticketId, 'Спасибо').expect(HttpStatus.CREATED);

    expect((await toStaff).message).toMatchObject({ text: 'Спасибо', authorName: 'Иван Петров' });
  });

  it('should keep another user out of the ticket room', async () => {
    const stranger = await connect((await registerUser(app, SECOND_CLIENT)).cookies);
    const leaked = collectEvents(stranger, SOCKET_EVENTS.SUPPORT_MESSAGE);

    expect(await join(stranger, ticketId)).toEqual({ ok: false, reason: 'not_found' });
    await postTicketMessage(app, client, ticketId, 'Ещё').expect(HttpStatus.CREATED);
    await roundTrip(stranger);
    expect(leaked).toEqual([]);
  });

  it('should tell the staff about tickets without texts or names', async () => {
    const staff = await connect(manager);
    const other = (await registerUser(app, SECOND_CLIENT)).cookies;
    const created = waitForEvent(staff, SOCKET_EVENTS.SUPPORT_TICKET);
    await postTicket(app, other, { topic: 'account', message: 'Почта' }).expect(HttpStatus.CREATED);
    const event = await created;

    expect(event).toEqual({
      ticketId: expect.any(Number),
      kind: 'created',
      awaitingStaff: true,
      status: 'open',
    });
    expect(supportTicketEventSchema.safeParse(event).success).toBe(true);
  });

  it('should tell the author outside the room about a reply and a close', async () => {
    const author = await connect(client);
    const replied = waitForEvent(author, SOCKET_EVENTS.SUPPORT_TICKET);
    await postStaffMessage(app, manager, ticketId, 'Ответ').expect(HttpStatus.CREATED);

    expect(await replied).toEqual({
      ticketId,
      kind: 'message',
      awaitingStaff: false,
      status: 'open',
    });

    const closed = waitForEvent(author, SOCKET_EVENTS.SUPPORT_TICKET);
    await postStaffAction(app, manager, SUPPORT_STAFF_ROUTES.CLOSE, ticketId).expect(HttpStatus.OK);

    expect(await closed).toEqual({
      ticketId,
      kind: 'closed',
      awaitingStaff: false,
      status: 'closed',
    });
  });

  it('should save a staff reply before the author closes the ticket or refuse it', async () => {
    const [reply, close] = await Promise.all([
      postStaffMessage(app, manager, ticketId, 'Успел?'),
      postTicketAction(app, client, SUPPORT_ROUTES.CLOSE, ticketId),
    ]);
    const saved = await db.select().from(messages).where(eq(messages.ticketId, ticketId));
    const outcome = { status: reply.status, code: reply.body.code ?? null, saved: saved.length };

    expect(close.status).toBe(HttpStatus.OK);
    expect([
      { status: HttpStatus.CREATED, code: null, saved: 2 },
      { status: HttpStatus.CONFLICT, code: 'TICKET_CLOSED', saved: 1 },
    ]).toContainEqual(outcome);
  });
});
