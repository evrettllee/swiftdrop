import type { Database, Transaction } from '@/database/database.module';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { SupportEventsService } from '@/modules/support/services/support-events.service';
import { SupportMessageWriterService } from '@/modules/support/services/support-message-writer.service';
import { SupportTicketClosingService } from '@/modules/support/services/support-ticket-closing.service';
import { SupportTicketMessagesService } from '@/modules/support/services/support-ticket-messages.service';
import { queueDatabase } from './queue-database';

export const AUTHOR = { userId: 7, role: 'client' } as const;
export const STAFF = { userId: 50, role: 'manager' } as const;
export const SENT_AT = new Date('2026-10-30T10:00:00Z');
export const OPEN = [{ ticketId: 3, userId: 7, status: 'open' }];
export const inserted = (senderId: number) => [
  { messageId: 40, senderId, content: 'Текст', sentAt: SENT_AT, isRead: false },
];
export const state = (awaitingStaff: boolean, status = 'open') => [
  { ticketId: 3, userId: 7, status, awaitingStaff },
];

export function setUpSupport(results: unknown[][], failure?: Error) {
  const fake = queueDatabase(results);
  const log: string[] = [];
  const db = Object.assign(Object.create(fake.db as object) as object, {
    transaction: async <T>(work: (tx: Transaction) => Promise<T>) => {
      const result = await work(fake.tx);

      if (failure) {
        throw failure;
      }

      log.push('commit');

      return result;
    },
  }) as Database;
  const sent: { to: string; event: string; payload: unknown; options?: unknown }[] = [];
  const record =
    (to: string) =>
    (...args: unknown[]) => {
      const [first, ...rest] = args;
      const [event, payload, options] = to === 'staff' ? [first, ...rest] : rest;
      sent.push({
        to: to === 'staff' ? 'staff' : `${to}:${String(first)}`,
        event: String(event),
        payload,
        options,
      });
      log.push(`${to} ${String(event)}`);
    };
  const realtime = {
    toTicket: jest.fn(record('ticket')),
    toStaff: jest.fn(record('staff')),
    toUser: jest.fn(record('user')),
  } as unknown as RealtimeEventsService;
  const events = new SupportEventsService(realtime);
  const writer = new SupportMessageWriterService(db, events);
  const service = new SupportTicketMessagesService(db, writer, events);
  const closing = new SupportTicketClosingService(writer);

  return { service, closing, fake, log, sent };
}
