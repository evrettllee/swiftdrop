import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { createTestApp } from '@test/support/app';
import { registerUser, validRegistration } from '@test/support/auth';
import { SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  emitWithAck,
  listenTestApp,
  roundTrip,
  waitForDisconnect,
} from '@test/support/sockets';
import { postTicket, postTicketMessage } from '@test/support/support-tickets';
import { blockUser } from '@test/support/users';

describe('Ticket room access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let client: string;
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
    const created = await postTicket(app, client, { topic: 'payment', message: 'Деньги' });
    ticketId = created.body.id;
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

  it('should keep another user out of the ticket room', async () => {
    const stranger = await connect((await registerUser(app, SECOND_CLIENT)).cookies);
    const leaked = collectEvents(stranger, SOCKET_EVENTS.SUPPORT_MESSAGE);

    expect(await join(stranger, ticketId)).toEqual({ ok: false, reason: 'not_found' });
    await postTicketMessage(app, client, ticketId, 'Ещё').expect(HttpStatus.CREATED);
    await roundTrip(stranger);
    expect(leaked).toEqual([]);
  });

  it('should keep an author blocked since the socket opened out and close the socket', async () => {
    const author = await connect(client);
    const closed = waitForDisconnect(author);
    await blockUser(db, validRegistration.email);

    expect(await join(author, ticketId)).toEqual({ ok: false, reason: 'not_found' });
    expect(await closed).toBe('io server disconnect');
  });
});
