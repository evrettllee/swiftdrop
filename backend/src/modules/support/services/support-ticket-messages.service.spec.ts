import type { HttpException } from '@nestjs/common';
import type { Database, Transaction } from '@/database/database.module';
import { queueDatabase } from '@test/support/queue-database';
import type { SupportAuthor, TicketDetails } from '../types/support.types';
import { SupportMessageWriterService } from './support-message-writer.service';
import { SupportTicketMessagesService } from './support-ticket-messages.service';
import { SupportTicketsService } from './support-tickets.service';

const AUTHOR: SupportAuthor = { userId: 7, role: 'client' };
const MESSAGE_ROW = {
  messageId: 40,
  senderId: 7,
  content: 'Ещё вопрос',
  sentAt: new Date('2026-10-30T10:00:00Z'),
  isRead: false,
  senderFirstName: 'Иван',
  senderLastName: 'Петров',
};

function databaseOf(results: unknown[][]) {
  const fake = queueDatabase(results);
  const db = Object.assign(Object.create(fake.db as object) as object, {
    transaction: <T>(work: (tx: Transaction) => Promise<T>) => work(fake.tx),
  }) as Database;

  return { fake, db };
}

const failureOf = async (promise: Promise<unknown>) =>
  ((await promise.catch((caught: unknown) => caught)) as HttpException).getResponse();

describe('SupportTicketMessagesService', () => {
  it('should write the message through the shared writer and wait for staff', async () => {
    const { fake, db } = databaseOf([
      [{ status: 'open' }],
      [{ messageId: 40, sentAt: new Date() }],
      [],
      [MESSAGE_ROW],
    ]);
    const service = new SupportTicketMessagesService(db, new SupportMessageWriterService());

    const message = await service.send(AUTHOR, 3, 'Ещё вопрос');

    const update = fake.calls.find((call) => call.method === 'set')?.args[0];
    expect(update).toMatchObject({ awaitingStaff: true });
    expect(message).toMatchObject({ id: 40, fromStaff: false, text: 'Ещё вопрос' });
    expect(fake.calls.some((call) => call.method === 'for')).toBe(true);
  });

  it('should refuse a message to a closed ticket with TICKET_CLOSED', async () => {
    const { db } = databaseOf([[{ status: 'closed' }]]);
    const write = jest.fn();
    const service = new SupportTicketMessagesService(db, {
      write,
    } as unknown as SupportMessageWriterService);

    expect(await failureOf(service.send(AUTHOR, 3, 'Текст'))).toMatchObject({
      statusCode: 409,
      code: 'TICKET_CLOSED',
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('should answer 404 for a foreign ticket', async () => {
    const { db } = databaseOf([[]]);
    const service = new SupportTicketMessagesService(db, new SupportMessageWriterService());

    expect(await failureOf(service.send(AUTHOR, 3, 'Текст'))).toMatchObject({ statusCode: 404 });
    expect(await failureOf(service.markRead(AUTHOR, 3))).toMatchObject({ statusCode: 404 });
  });

  it('should mark the staff messages read and give the unread left', async () => {
    const { db } = databaseOf([
      [{ status: 'open' }],
      [{ messageId: 1 }, { messageId: 2 }],
      [{ total: 0 }],
    ]);
    const service = new SupportTicketMessagesService(db, new SupportMessageWriterService());

    expect(await service.markRead(AUTHOR, 3)).toEqual({ readCount: 2, unreadCount: 0 });
  });
});

describe('SupportMessageWriterService', () => {
  it.each([
    [false, true],
    [true, false],
  ])(
    'should move the last message time and set awaiting staff for fromStaff %s',
    async (fromStaff, awaiting) => {
      const sentAt = new Date('2026-10-30T10:00:00Z');
      const fake = queueDatabase([[{ messageId: 5, sentAt }]]);

      await new SupportMessageWriterService().write(fake.tx, {
        ticketId: 3,
        senderId: 7,
        text: 'Текст',
        fromStaff,
      });

      const [inserted, updated] = fake.calls.filter((call) =>
        ['values', 'set'].includes(call.method),
      );
      expect(inserted.args[0]).toEqual({
        ticketId: 3,
        senderId: 7,
        receiverId: null,
        content: 'Текст',
      });
      expect(updated.args[0]).toEqual({ lastMessageAt: sentAt, awaitingStaff: awaiting });
    },
  );
});

describe('SupportTicketsService.close', () => {
  it('should close only an open ticket of the author and answer the same when closed already', async () => {
    const { fake, db } = databaseOf([[], []]);
    const service = new SupportTicketsService(db);
    const get = jest.spyOn(service, 'get').mockResolvedValue({ id: 3 } as unknown as TicketDetails);

    await service.close(AUTHOR, 3);
    await service.close(AUTHOR, 3);

    const sets = fake.calls.filter((call) => call.method === 'set').map((call) => call.args[0]);
    expect(sets[0]).toMatchObject({ status: 'closed', closedBy: 7, awaitingStaff: false });
    expect(get).toHaveBeenCalledTimes(2);
  });
});
