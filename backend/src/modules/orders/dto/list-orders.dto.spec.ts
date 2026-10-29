import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { encodeListCursor } from '@/common/utils/list-cursor';
import {
  ORDERS_PAGE_SIZE_DEFAULT,
  ORDERS_VALIDATION_MESSAGES,
} from '../constants/orders.constants';
import { listOrdersSchema } from './list-orders.dto';

const CREATED_AT_CURSOR = encodeListCursor({
  k: 'createdAt',
  d: 'desc',
  v: '1793000000123456',
  id: 9,
});

function parse(query: Record<string, unknown>) {
  return listOrdersSchema.safeParse(query);
}

function messagesOf(query: Record<string, unknown>): string[] {
  const result = parse(query);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('listOrdersSchema defaults', () => {
  it('should read no parameters as the first page of ten, newest first, everything', () => {
    const result = parse({});

    expect(result.success && result.data).toEqual({
      pagination: { mode: 'page', page: 1, limit: ORDERS_PAGE_SIZE_DEFAULT, until: null },
      sort: { key: 'createdAt', direction: 'desc' },
      period: { start: null, end: null },
      filter: null,
      status: null,
    });
  });

  it('should keep the filter the frontend sends today', () => {
    const result = parse({ page: '2', limit: '5', filter: 'finished' });

    expect(result.success && result.data).toMatchObject({
      pagination: { mode: 'page', page: 2, limit: 5 },
      filter: 'finished',
    });
  });
});

describe('listOrdersSchema pagination', () => {
  it.each(['0', '101', '1.5', 'x'])('should refuse the limit %j', (limit) => {
    expect(messagesOf({ limit })).toEqual([LIST_VALIDATION_MESSAGES.LIMIT_INVALID]);
  });

  it.each(['1', '100'])('should take the limit %j', (limit) => {
    expect(parse({ limit }).success).toBe(true);
  });

  it('should allow a page that starts exactly 10 000 rows in', () => {
    expect(parse({ page: '101', limit: '100' }).success).toBe(true);
    expect(parse({ page: '10001', limit: '1' }).success).toBe(true);
  });

  it('should refuse a page that starts further than 10 000 rows in', () => {
    expect(messagesOf({ page: '102', limit: '100' })).toEqual([LIST_VALIDATION_MESSAGES.TOO_DEEP]);
    expect(messagesOf({ page: '10002', limit: '1' })).toEqual([LIST_VALIDATION_MESSAGES.TOO_DEEP]);
  });

  it('should keep the bound of the list', () => {
    const result = parse({ until: '42' });

    expect(result.success && result.data.pagination).toMatchObject({ mode: 'page', until: 42 });
  });

  it('should refuse a page and a cursor together', () => {
    expect(messagesOf({ page: '1', cursor: '' })).toEqual([
      LIST_VALIDATION_MESSAGES.PAGE_AND_CURSOR,
    ]);
  });

  it('should refuse a bound in the cursor mode', () => {
    expect(messagesOf({ cursor: '', until: '5' })).toEqual([
      LIST_VALIDATION_MESSAGES.CURSOR_AND_UNTIL,
    ]);
  });

  it('should read an empty cursor as the first page of the cursor mode', () => {
    const result = parse({ cursor: '' });

    expect(result.success && result.data.pagination).toEqual({
      mode: 'cursor',
      limit: ORDERS_PAGE_SIZE_DEFAULT,
      position: null,
    });
  });

  it('should read the position of a cursor of the same sort', () => {
    const result = parse({ cursor: CREATED_AT_CURSOR });

    expect(result.success && result.data.pagination).toMatchObject({
      position: { value: '1793000000123456', id: 9 },
    });
  });

  it('should refuse a broken cursor', () => {
    expect(messagesOf({ cursor: 'not-a-cursor' })).toEqual([
      LIST_VALIDATION_MESSAGES.CURSOR_INVALID,
    ]);
  });

  it('should refuse a cursor whose value does not fit its key', () => {
    const cursor = encodeListCursor({ k: 'createdAt', d: 'desc', v: '2026-10-29', id: 9 });

    expect(messagesOf({ cursor })).toEqual([LIST_VALIDATION_MESSAGES.CURSOR_INVALID]);
  });

  it.each([
    ['another key', 'price:desc'],
    ['another direction', 'createdAt:asc'],
  ])('should refuse a cursor made for %s', (_, sort) => {
    expect(messagesOf({ cursor: CREATED_AT_CURSOR, sort })).toEqual([
      LIST_VALIDATION_MESSAGES.CURSOR_SORT_MISMATCH,
    ]);
  });
});

describe('listOrdersSchema sort', () => {
  it.each([
    ['createdAt:asc', { key: 'createdAt', direction: 'asc' }],
    ['price:desc', { key: 'price', direction: 'desc' }],
  ])('should take %s', (sort, expected) => {
    const result = parse({ sort });

    expect(result.success && result.data.sort).toEqual(expected);
  });

  it.each(['status:desc', 'price', 'price:down', 'price:desc:extra', 'constructor:asc', ''])(
    'should refuse %j',
    (sort) => {
      expect(messagesOf({ sort })).toEqual([LIST_VALIDATION_MESSAGES.SORT_INVALID]);
    },
  );
});

describe('listOrdersSchema filters', () => {
  it('should read the groups of statuses separated by commas', () => {
    const result = parse({ status: 'finished,cancelled,finished' });

    expect(result.success && result.data.status).toEqual(['finished', 'cancelled']);
  });

  it.each(['delivered', 'active,', 'active,unknown'])('should refuse the status %j', (status) => {
    expect(messagesOf({ status })).toEqual([LIST_VALIDATION_MESSAGES.FILTER_VALUE_INVALID]);
  });

  it('should refuse the filter and the status together', () => {
    expect(messagesOf({ filter: 'active', status: 'active' })).toEqual([
      ORDERS_VALIDATION_MESSAGES.FILTER_AND_STATUS,
    ]);
  });

  it('should take a period of whole days in Minsk', () => {
    const result = parse({ from: '2026-10-01', to: '2026-10-31' });

    expect(result.success && result.data.period).toEqual({
      start: new Date('2026-09-30T21:00:00.000Z'),
      end: new Date('2026-10-31T21:00:00.000Z'),
    });
  });

  it('should refuse a period that ends before it starts', () => {
    expect(messagesOf({ from: '2026-10-02', to: '2026-10-01' })).toEqual([
      LIST_VALIDATION_MESSAGES.PERIOD_INVALID,
    ]);
  });

  it.each(['2026-02-30', '01.10.2026'])('should refuse the date %j', (from) => {
    expect(messagesOf({ from })).toEqual([LIST_VALIDATION_MESSAGES.DATE_INVALID]);
  });

  it('should refuse an unknown parameter and name it', () => {
    expect(messagesOf({ q: 'Ленина' })).toEqual([
      `${LIST_VALIDATION_MESSAGES.UNKNOWN_PARAMETER}: q`,
    ]);
  });

  it('should refuse a parameter given twice', () => {
    expect(parse({ page: ['1', '2'] }).success).toBe(false);
    expect(parse({ cursor: ['', ''] }).success).toBe(false);
  });
});
