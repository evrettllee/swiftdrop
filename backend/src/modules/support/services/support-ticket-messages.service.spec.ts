import type { HttpException } from '@nestjs/common';
import {
  supportMessageEventSchema,
  supportTicketEventSchema,
} from '@/modules/realtime/dto/support-events.dto';
import {
  AUTHOR,
  inserted,
  OPEN,
  SENT_AT,
  setUpSupport as setUp,
  STAFF,
  state,
} from '@test/support/support-fakes';

const failureOf = async (promise: Promise<unknown>) =>
  ((await promise.catch((caught: unknown) => caught)) as HttpException).getResponse();

describe('SupportTicketMessagesService.send', () => {
  it('should save an author message, then tell the room and the staff after the commit', async () => {
    const { service, fake, log, sent } = setUp([
      OPEN,
      inserted(7),
      state(true),
      [{ senderFirstName: 'Иван', senderLastName: 'Петров' }],
    ]);

    const message = await service.send(AUTHOR, 3, 'Текст');

    expect(fake.calls.find((call) => call.method === 'set')?.args[0]).toEqual({
      lastMessageAt: SENT_AT,
      awaitingStaff: true,
    });
    expect(message).toMatchObject({ id: 40, fromStaff: false, authorName: 'Иван Петров' });
    expect(log).toEqual(['commit', 'ticket support:message', 'staff support:ticket']);
    expect(supportMessageEventSchema.safeParse(sent[0].payload).success).toBe(true);
    expect(sent[1].payload).toEqual({
      ticketId: 3,
      kind: 'message',
      awaitingStaff: true,
      status: 'open',
    });
  });

  it('should give a staff reply to the author and to the staff in their own form', async () => {
    const { service, sent } = setUp([
      OPEN,
      inserted(50),
      state(false),
      [{ senderFirstName: 'Елена', senderLastName: 'Жукова' }],
    ]);

    const message = await service.send(STAFF, 3, 'Текст');
    const [forAuthor, forStaff, toStaff, toAuthor] = sent;

    expect(message).toMatchObject({ fromStaff: true, authorName: 'Елена Ж.' });
    expect(forAuthor).toMatchObject({ to: 'ticket:3', options: { exceptStaff: true } });
    expect(forAuthor.payload).toMatchObject({ message: { authorName: 'Елена, поддержка' } });
    expect(forStaff).toMatchObject({ to: 'ticket:3', options: { exceptUserId: 7 } });
    expect(forStaff.payload).toMatchObject({ message: { authorName: 'Елена Ж.' } });
    expect(toStaff).toMatchObject({ to: 'staff', event: 'support:ticket' });
    expect(toAuthor).toMatchObject({ to: 'user:7', event: 'support:ticket' });
    expect(supportTicketEventSchema.safeParse(toStaff.payload).success).toBe(true);
    expect(JSON.stringify(toStaff.payload)).not.toMatch(/Елена|Жукова|Текст/);
  });

  it('should refuse a message to a closed ticket with TICKET_CLOSED and tell nobody', async () => {
    const { service, log } = setUp([[{ ticketId: 3, userId: 7, status: 'closed' }]]);

    expect(await failureOf(service.send(STAFF, 3, 'Текст'))).toMatchObject({
      statusCode: 409,
      code: 'TICKET_CLOSED',
    });
    expect(log).toEqual([]);
  });

  it('should tell nobody when the transaction rolls back', async () => {
    const { service, log } = setUp(
      [OPEN, inserted(7), state(true), [{ senderFirstName: 'Иван', senderLastName: 'Петров' }]],
      new Error('rolled back'),
    );

    await expect(service.send(AUTHOR, 3, 'Текст')).rejects.toThrow('rolled back');
    expect(log).toEqual([]);
  });

  it('should answer 404 for a foreign ticket', async () => {
    const { service } = setUp([[]]);

    expect(await failureOf(service.send(AUTHOR, 3, 'Текст'))).toMatchObject({ statusCode: 404 });
  });
});

describe('SupportTicketMessagesService.markRead', () => {
  it('should mark the author messages for the staff and tell the room who read', async () => {
    const { service, sent } = setUp([OPEN, [{ messageId: 1 }], [{ count: 0 }]]);

    await service.markRead(STAFF, 3);

    expect(sent).toEqual([
      {
        to: 'ticket:3',
        event: 'support:read',
        payload: { ticketId: 3, by: 'staff' },
        options: undefined,
      },
    ]);
  });

  it('should tell nobody when nothing was unread', async () => {
    const { service, sent } = setUp([OPEN, [], [{ count: 0 }]]);

    await service.markRead(AUTHOR, 3);

    expect(sent).toEqual([]);
  });
});
