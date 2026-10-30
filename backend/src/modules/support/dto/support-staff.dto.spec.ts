import { staffTicketsSchema } from './support-staff.dto';

describe('staffTicketsSchema', () => {
  it('should show the awaiting tickets by default, the longest waiting first', () => {
    expect(staffTicketsSchema.parse({})).toMatchObject({
      pagination: { mode: 'page', page: 1, limit: 20, until: null },
      sort: { key: 'lastMessageAt', direction: 'asc' },
      filters: { view: 'awaiting', topics: null, authorRole: null, search: null },
    });
  });

  it.each(['open', 'closed'])('should show the %s tickets newest first by default', (view) => {
    expect(staffTicketsSchema.parse({ view }).sort).toEqual({
      key: 'lastMessageAt',
      direction: 'desc',
    });
  });

  it('should take a sort, several topics, an author role, a search and a period', () => {
    const query = staffTicketsSchema.parse({
      view: 'open',
      sort: 'createdAt:asc',
      topic: 'payment,app',
      authorRole: 'courier',
      q: '+375 29 123-45-67',
      from: '2026-10-01',
      until: '40',
    });

    expect(query.sort).toEqual({ key: 'createdAt', direction: 'asc' });
    expect(query.filters).toMatchObject({
      topics: ['payment', 'app'],
      authorRole: 'courier',
      search: { kind: 'number', phone: '+375291234567' },
    });
    expect(query.pagination).toMatchObject({ until: 40 });
    expect(query.period.start).not.toBeNull();
  });

  it.each([
    ['a cursor', { cursor: '' }],
    ['an unknown view', { view: 'mine' }],
    ['an unknown sort', { sort: 'topic:asc' }],
    ['a staff author role', { authorRole: 'manager' }],
    ['an unknown topic', { topic: 'refund' }],
    ['an unknown field', { assignee: '1' }],
  ])('should refuse %s', (_name, query) => {
    expect(staffTicketsSchema.safeParse(query).success).toBe(false);
  });
});
