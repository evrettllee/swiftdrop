import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import {
  MANAGER_ORDERS_PAGE_SIZE_DEFAULT,
  MANAGER_ORDERS_VALIDATION_MESSAGES,
} from '../constants/manager-orders.constants';
import { managerOrderCountsSchema, managerOrdersSchema } from './manager-orders.dto';

function messagesOf(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe('managerOrdersSchema', () => {
  it('should read no parameters as twenty newest orders of every status', () => {
    const result = managerOrdersSchema.safeParse({});

    expect(result.success && result.data).toEqual({
      pagination: { mode: 'page', page: 1, limit: MANAGER_ORDERS_PAGE_SIZE_DEFAULT, until: null },
      sort: { key: 'createdAt', direction: 'desc' },
      period: { start: null, end: null },
      status: null,
      filters: {
        period: { start: null, end: null },
        courierId: null,
        payment: null,
        fragile: false,
        search: null,
      },
    });
  });

  it('should read the groups, the payment states, the courier, fragile parcels and the search', () => {
    const result = managerOrdersSchema.safeParse({
      status: 'attention,active',
      payment: 'paid,refunded',
      courierId: '3',
      fragile: 'true',
      q: '  +375 29 123-45-67 ',
      sort: 'statusChangedAt:asc',
    });

    expect(result.success && result.data).toMatchObject({
      status: ['attention', 'active'],
      sort: { key: 'statusChangedAt', direction: 'asc' },
      filters: {
        courierId: 3,
        payment: ['paid', 'refunded'],
        fragile: true,
        search: { kind: 'number', orderId: null, phone: '+375291234567' },
      },
    });
  });

  it.each([
    ['an unknown group', { status: 'delivered' }, LIST_VALIDATION_MESSAGES.FILTER_VALUE_INVALID],
    [
      'an unknown payment state',
      { payment: 'pending' },
      LIST_VALIDATION_MESSAGES.FILTER_VALUE_INVALID,
    ],
    [
      'fragile other than true',
      { fragile: 'false' },
      MANAGER_ORDERS_VALIDATION_MESSAGES.FRAGILE_INVALID,
    ],
    [
      'a courier id of zero',
      { courierId: '0' },
      MANAGER_ORDERS_VALIDATION_MESSAGES.COURIER_ID_INVALID,
    ],
    ['an unknown sort key', { sort: 'email:asc' }, LIST_VALIDATION_MESSAGES.SORT_INVALID],
    ['an empty search', { q: '   ' }, LIST_VALIDATION_MESSAGES.SEARCH_INVALID],
    ['a search with NUL', { q: 'a\u0000b' }, LIST_VALIDATION_MESSAGES.SEARCH_FORBIDDEN_CHARACTER],
    ['a search of 101 characters', { q: 'a'.repeat(101) }, LIST_VALIDATION_MESSAGES.SEARCH_INVALID],
    [
      'a text search of two characters',
      { q: ' Ан ' },
      MANAGER_ORDERS_VALIDATION_MESSAGES.TEXT_SEARCH_TOO_SHORT,
    ],
    [
      'two signs with no digits',
      { q: '+-' },
      MANAGER_ORDERS_VALIDATION_MESSAGES.TEXT_SEARCH_TOO_SHORT,
    ],
    ['a limit above 100', { limit: '101' }, LIST_VALIDATION_MESSAGES.LIMIT_INVALID],
    [
      'an unknown parameter',
      { phone: '1' },
      `${LIST_VALIDATION_MESSAGES.UNKNOWN_PARAMETER}: phone`,
    ],
  ])('should refuse %s', (_, query, message) => {
    expect(messagesOf(managerOrdersSchema.safeParse(query))).toEqual([message]);
  });

  it.each([
    ['7', { kind: 'number', orderId: 7, phone: null }],
    ['Ann', { kind: 'text', pattern: '%Ann%' }],
  ])('should take the short search %j', (q, search) => {
    const result = managerOrdersSchema.safeParse({ q });

    expect(result.success && result.data.filters.search).toEqual(search);
  });

  it('should refuse a short text search in the counts as well', () => {
    expect(messagesOf(managerOrderCountsSchema.safeParse({ q: 'Ан' }))).toEqual([
      MANAGER_ORDERS_VALIDATION_MESSAGES.TEXT_SEARCH_TOO_SHORT,
    ]);
  });

  it('should read an empty cursor as the first page of the cursor mode', () => {
    const result = managerOrdersSchema.safeParse({ cursor: '', sort: 'statusChangedAt:asc' });

    expect(result.success && result.data.pagination).toEqual({
      mode: 'cursor',
      limit: MANAGER_ORDERS_PAGE_SIZE_DEFAULT,
      position: null,
    });
  });
});

describe('managerOrderCountsSchema', () => {
  it('should take the same filters and the bound of the list', () => {
    const result = managerOrderCountsSchema.safeParse({ q: 'Анна', fragile: 'true', until: '90' });

    expect(result.success && result.data).toEqual({
      until: 90,
      filters: {
        period: { start: null, end: null },
        courierId: null,
        payment: null,
        fragile: true,
        search: { kind: 'text', pattern: '%Анна%' },
      },
    });
  });

  it.each([['status'], ['page'], ['limit'], ['sort'], ['cursor']])(
    'should refuse the list parameter %s',
    (key) => {
      expect(messagesOf(managerOrderCountsSchema.safeParse({ [key]: '1' }))).toEqual([
        `${LIST_VALIDATION_MESSAGES.UNKNOWN_PARAMETER}: ${key}`,
      ]);
    },
  );

  it('should refuse a period that ends before it starts', () => {
    expect(
      messagesOf(managerOrderCountsSchema.safeParse({ from: '2026-10-02', to: '2026-10-01' })),
    ).toEqual([LIST_VALIDATION_MESSAGES.PERIOD_INVALID]);
  });
});
