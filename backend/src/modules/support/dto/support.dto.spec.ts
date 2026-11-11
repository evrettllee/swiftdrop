import {
  createTicketSchema,
  listTicketsSchema,
  sendTicketMessageSchema,
  ticketMessagesSchema,
} from './support.dto';

const issuesOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('createTicketSchema', () => {
  it('should take a subject only for the topic other, trimmed', () => {
    expect(
      createTicketSchema.parse({ topic: 'other', subject: '  Вопрос  ', message: ' Текст ' }),
    ).toEqual({ topic: 'other', subject: 'Вопрос', orderId: null, message: 'Текст' });
    expect(createTicketSchema.parse({ topic: 'payment', orderId: 5, message: 'Текст' })).toEqual({
      topic: 'payment',
      subject: null,
      orderId: 5,
      message: 'Текст',
    });
  });

  it('should require a subject for other and refuse one for other topics', () => {
    expect(issuesOf(createTicketSchema.safeParse({ topic: 'other', message: 'Текст' }))).toEqual([
      'Для темы «Другое» укажите заголовок',
    ]);
    expect(
      issuesOf(createTicketSchema.safeParse({ topic: 'app', subject: 'Тема', message: 'Текст' })),
    ).toEqual(['Заголовок указывается только для темы «Другое»']);
  });

  it.each([
    ['an empty subject', { topic: 'other', subject: '   ', message: 'Текст' }],
    ['a subject over 80', { topic: 'other', subject: 'я'.repeat(81), message: 'Текст' }],
    ['an empty message', { topic: 'app', message: '  ' }],
    ['a message over 1000', { topic: 'app', message: 'я'.repeat(1001) }],
    ['an unknown topic', { topic: 'refund', message: 'Текст' }],
    ['an unknown field', { topic: 'app', message: 'Текст', userId: 2 }],
    ['a text order id', { topic: 'app', message: 'Текст', orderId: '5' }],
  ])('should refuse %s', (_name, body) => {
    expect(createTicketSchema.safeParse(body).success).toBe(false);
  });

  it('should take a subject of 80 characters and a message of 1000', () => {
    expect(
      createTicketSchema.safeParse({
        topic: 'other',
        subject: 'я'.repeat(80),
        message: 'я'.repeat(1000),
      }).success,
    ).toBe(true);
  });
});

describe('listTicketsSchema', () => {
  it('should read the first page of the cursor mode by the last message, newest first', () => {
    expect(listTicketsSchema.parse({})).toMatchObject({
      pagination: { mode: 'cursor', limit: 20, position: null },
      sort: { key: 'lastMessageAt', direction: 'desc' },
      status: null,
    });
    expect(listTicketsSchema.parse({ status: 'closed', limit: '1' })).toMatchObject({
      pagination: { limit: 1 },
      status: 'closed',
    });
  });

  it('should refuse a page number, an unknown status and an unknown sort', () => {
    expect(listTicketsSchema.safeParse({ page: '2' }).success).toBe(false);
    expect(listTicketsSchema.safeParse({ status: 'pending' }).success).toBe(false);
    expect(listTicketsSchema.safeParse({ sort: 'topic:asc' }).success).toBe(false);
  });
});

describe('ticketMessagesSchema and sendTicketMessageSchema', () => {
  it('should read messages newest first, 30 by default', () => {
    expect(ticketMessagesSchema.parse({})).toMatchObject({
      pagination: { mode: 'cursor', limit: 30, position: null },
      sort: { key: 'id', direction: 'desc' },
    });
    expect(ticketMessagesSchema.safeParse({ sort: 'id:asc' }).success).toBe(false);
  });

  it('should take a text of 1 to 1000 characters after trim', () => {
    expect(sendTicketMessageSchema.parse({ text: ' Привет ' })).toEqual({ text: 'Привет' });
    expect(sendTicketMessageSchema.safeParse({ text: ' ' }).success).toBe(false);
    expect(sendTicketMessageSchema.safeParse({ text: 'я'.repeat(1001) }).success).toBe(false);
  });
});
