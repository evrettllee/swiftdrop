import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { encodeListCursor } from '@/common/utils/list-cursor';
import {
  HISTORY_PAGE_SIZE_DEFAULT,
  HISTORY_VALIDATION_MESSAGES,
} from '../constants/deliveries.constants';
import { courierHistorySchema } from './courier-history.dto';

function messagesOf(query: Record<string, unknown>): string[] {
  const result = courierHistorySchema.safeParse(query);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('courierHistorySchema', () => {
  it('should read no parameters as the first page of ten, the last finished first', () => {
    const result = courierHistorySchema.safeParse({});

    expect(result.success && result.data).toEqual({
      pagination: { mode: 'page', page: 1, limit: HISTORY_PAGE_SIZE_DEFAULT, until: null },
      sort: { key: 'finishedAt', direction: 'desc' },
      period: { start: null, end: null },
      search: null,
    });
  });

  it('should take the cursor of the id sort', () => {
    const cursor = encodeListCursor({ k: 'id', d: 'desc', v: '12', id: 12 });
    const result = courierHistorySchema.safeParse({ cursor, sort: 'id:desc' });

    expect(result.success && result.data.pagination).toMatchObject({
      mode: 'cursor',
      position: { value: '12', id: 12 },
    });
  });

  it('should refuse a sort by a key it does not have', () => {
    expect(messagesOf({ sort: 'createdAt:desc' })).toEqual([LIST_VALIDATION_MESSAGES.SORT_INVALID]);
  });

  it('should sort by the moment the order finished', () => {
    const result = courierHistorySchema.safeParse({ sort: 'finishedAt:desc' });

    expect(result.success && result.data.sort).toEqual({ key: 'finishedAt', direction: 'desc' });
  });

  it('should take the cursor of the finish time sort', () => {
    const cursor = encodeListCursor({ k: 'finishedAt', d: 'desc', v: '1792261697859619', id: 241 });
    const result = courierHistorySchema.safeParse({ cursor });

    expect(result.success && result.data.pagination).toMatchObject({
      position: { value: '1792261697859619', id: 241 },
    });
  });

  it('should take a period of whole days in Minsk', () => {
    const result = courierHistorySchema.safeParse({ from: '2026-10-29', to: '2026-10-29' });

    expect(result.success && result.data.period).toEqual({
      start: new Date('2026-10-28T21:00:00.000Z'),
      end: new Date('2026-10-29T21:00:00.000Z'),
    });
  });

  it.each([
    ['48232', { orderId: 48232 }],
    [' 48232 ', { orderId: 48232 }],
    ['0', { orderId: null }],
    ['99999999999', { orderId: null }],
  ])('should read the search %j as the number of an order', (q, search) => {
    const result = courierHistorySchema.safeParse({ q });

    expect(result.success && result.data.search).toEqual(search);
  });

  it.each(['Немига', '№48232', '48 232'])('should refuse the search %j', (q) => {
    expect(messagesOf({ q })).toEqual([HISTORY_VALIDATION_MESSAGES.SEARCH_NOT_NUMBER]);
  });

  it('should refuse an empty search', () => {
    expect(messagesOf({ q: '  ' })).toEqual([LIST_VALIDATION_MESSAGES.SEARCH_INVALID]);
  });

  it('should refuse a filter it does not support', () => {
    expect(messagesOf({ status: 'finished' })).toHaveLength(1);
  });

  it('should refuse a limit above 100', () => {
    expect(messagesOf({ limit: '101' })).toEqual([LIST_VALIDATION_MESSAGES.LIMIT_INVALID]);
  });
});
