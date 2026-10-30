import type { Socket } from 'socket.io';
import type { Database } from '@/database/database.module';
import { queueDatabase } from '@test/support/queue-database';
import type { AppSocketData } from '../types/realtime.types';
import { TicketRoomsService } from './ticket-rooms.service';

function socketOf(role: AppSocketData['role'], rooms: string[] = []) {
  const joined = new Set(rooms);
  const data = {
    userId: 7,
    role,
    sessionExpiresAtMs: Date.now() + 60_000,
    orderJoinAttemptsMs: [],
  } as unknown as AppSocketData;
  const socket = {
    data,
    rooms: joined,
    connected: true,
    join: jest.fn(async (room: string) => {
      joined.add(room);
    }),
    leave: jest.fn(async (room: string) => {
      joined.delete(room);
    }),
  } as unknown as Socket;

  return { socket, joined };
}

function serviceWith(results: unknown[][]) {
  const fake = queueDatabase(results);

  return { service: new TicketRoomsService(fake.db as Database), fake };
}

describe('TicketRoomsService', () => {
  it('should let the author into the room of their ticket', async () => {
    const { service, fake } = serviceWith([[{ ticketId: 3, userId: 7, status: 'open' }]]);
    const { socket, joined } = socketOf('client');

    expect(await service.join(socket, { ticketId: 3 })).toEqual({ ok: true });
    expect(joined.has('ticket:3')).toBe(true);
    expect(fake.calls.filter((call) => call.method === 'where')).toHaveLength(1);
  });

  it('should keep a stranger out as not found', async () => {
    const { service } = serviceWith([[]]);
    const { socket, joined } = socketOf('courier');

    expect(await service.join(socket, { ticketId: 3 })).toEqual({ ok: false, reason: 'not_found' });
    expect(joined.has('ticket:3')).toBe(false);
  });

  it('should let the staff into any ticket that exists', async () => {
    const { service } = serviceWith([[{ ticketId: 3, userId: 9, status: 'closed' }]]);
    const { socket, joined } = socketOf('manager');

    expect(await service.join(socket, { ticketId: 3 })).toEqual({ ok: true });
    expect(joined.has('ticket:3')).toBe(true);
  });

  it('should refuse a bad body, too many rooms and leave a room quietly', async () => {
    const { service, fake } = serviceWith([]);
    const full = socketOf(
      'client',
      [1, 2, 3, 4, 5].map((id) => `ticket:${id}`),
    );

    expect(await service.join(full.socket, { ticketId: '3' })).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(await service.join(full.socket, { ticketId: 6 })).toEqual({
      ok: false,
      reason: 'too_many_rooms',
    });
    await service.leave(full.socket, { ticketId: 5 });
    expect(full.joined.has('ticket:5')).toBe(false);
    expect(fake.calls).toEqual([]);
  });
});
