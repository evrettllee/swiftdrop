import type { HttpException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { TICKET_TOPIC_VALUES } from '@/common/enums/support-ticket.enum';
import type { Database, Transaction } from '@/database/database.module';
import { queueDatabase } from '@test/support/queue-database';
import type { CreateTicketDto } from '../dto/support.dto';
import type { SupportAuthor, SupportTransaction } from '../types/support.types';
import type { SupportMessageWriterService } from './support-message-writer.service';
import { isTopicAllowed, SupportTicketCreationService } from './support-ticket-creation.service';
import type { SupportTicketsService } from './support-tickets.service';

const CLIENT: SupportAuthor = { userId: 7, role: 'client' };
const COURIER: SupportAuthor = { userId: 8, role: 'courier' };
const DTO: CreateTicketDto = {
  topic: 'order_problem',
  subject: null,
  orderId: 12,
  message: 'Где заказ?',
};

function setUp(results: unknown[][], failure?: Error, after: unknown[][] = []) {
  const fake = queueDatabase(results);
  const outside = queueDatabase(after);
  const db = {
    transaction: async <T>(work: (tx: Transaction) => Promise<T>) => {
      const result = await work(fake.tx);

      if (failure) {
        throw failure;
      }

      return result;
    },
    select: (...args: unknown[]) => (outside.db.select as (...a: unknown[]) => unknown)(...args),
  } as unknown as Database;
  const write = jest.fn().mockResolvedValue({ messageId: 1, sentAt: new Date() });
  const created = jest.fn();
  const run = <T>(work: (supportTx: SupportTransaction) => Promise<T>) =>
    db.transaction((tx) => work({ tx, pending: [] }));
  const get = jest.fn().mockResolvedValue({ id: 3 });
  const service = new SupportTicketCreationService(
    db,
    { write, created, run } as unknown as SupportMessageWriterService,
    { get } as unknown as SupportTicketsService,
  );

  return { service, fake, write, get, created };
}

const failureOf = async (promise: Promise<unknown>) =>
  ((await promise.catch((caught: unknown) => caught)) as HttpException).getResponse();

describe('isTopicAllowed', () => {
  it.each(TICKET_TOPIC_VALUES)('should give the topic %s to the right roles', (topic) => {
    const client = ['order_problem', 'payment', 'account', 'other'].includes(topic);
    const courier = ['order_problem', 'client_unreachable', 'app', 'other'].includes(topic);

    expect(isTopicAllowed(CLIENT, topic)).toBe(client);
    expect(isTopicAllowed(COURIER, topic)).toBe(courier);
  });
});

describe('SupportTicketCreationService', () => {
  it('should save the ticket and its first message from the author in one transaction', async () => {
    const { service, write, get, fake, created } = setUp([[{ orderId: 12 }], [{ ticketId: 3 }]]);

    await service.create(CLIENT, DTO);

    expect(write.mock.calls[0][0].tx).toBe(fake.tx);
    expect(created).toHaveBeenCalledWith(write.mock.calls[0][0], { ticketId: 3 });
    expect(write.mock.calls[0][1]).toEqual({
      ticketId: 3,
      senderId: 7,
      text: 'Где заказ?',
      fromStaff: false,
    });
    expect(get).toHaveBeenCalledWith(CLIENT, 3);
  });

  it('should refuse a topic of the other role with 400 before the database', async () => {
    const { service, fake } = setUp([]);

    expect(await failureOf(service.create(CLIENT, { ...DTO, topic: 'app' }))).toMatchObject({
      statusCode: 400,
    });
    expect(fake.calls).toEqual([]);
  });

  it('should answer 404 for a foreign or missing order and save nothing', async () => {
    const { service, write } = setUp([[]]);

    expect(await failureOf(service.create(COURIER, DTO))).toMatchObject({ statusCode: 404 });
    expect(write).not.toHaveBeenCalled();
  });

  it('should check a courier by the shared rule of who was on the order', async () => {
    const { service, fake } = setUp([[{ orderId: 12 }], [{ ticketId: 3 }]]);

    await service.create(COURIER, DTO);

    expect(fake.calls.filter((call) => call.method === 'select').length).toBeGreaterThan(1);
  });

  it('should answer TICKET_ALREADY_OPEN with the open ticket on the unique index', async () => {
    const violation = Object.assign(new DatabaseError('duplicate key', 0, 'error'), {
      code: '23505',
      constraint: 'support_tickets_one_open_per_order_uidx',
    });
    const { service } = setUp([[{ orderId: 12 }], [{ ticketId: 4 }]], violation, [
      [{ ticketId: 2 }],
    ]);

    expect(await failureOf(service.create(CLIENT, DTO))).toEqual({
      statusCode: 409,
      code: 'TICKET_ALREADY_OPEN',
      message: 'По этому заказу у вас уже есть открытое обращение',
      ticketId: 2,
    });
  });
});
