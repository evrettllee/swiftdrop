import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { encodeListCursor } from '@/common/utils/list-cursor';
import { HISTORY_PAGE_SIZE_DEFAULT } from '../constants/deliveries.constants';
import { courierHistorySchema } from './courier-history.dto';

function messagesOf(query: Record<string, unknown>): string[] {
  const result = courierHistorySchema.safeParse(query);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('courierHistorySchema', () => {
  it('should read no parameters as the first page of ten by id, newest first', () => {
    const result = courierHistorySchema.safeParse({});

    expect(result.success && result.data).toEqual({
      pagination: { mode: 'page', page: 1, limit: HISTORY_PAGE_SIZE_DEFAULT, until: null },
      sort: { key: 'id', direction: 'desc' },
      period: { start: null, end: null },
    });
  });

  it('should take the cursor of the id sort', () => {
    const cursor = encodeListCursor({ k: 'id', d: 'desc', v: '12', id: 12 });
    const result = courierHistorySchema.safeParse({ cursor });

    expect(result.success && result.data.pagination).toMatchObject({
      mode: 'cursor',
      position: { value: '12', id: 12 },
    });
  });

  it('should refuse a sort by a key it does not have', () => {
    expect(messagesOf({ sort: 'createdAt:desc' })).toEqual([LIST_VALIDATION_MESSAGES.SORT_INVALID]);
  });

  it.each([
    ['a period', { from: '2026-10-01' }],
    ['a filter', { status: 'finished' }],
  ])('should refuse %s it does not support', (_, query) => {
    expect(messagesOf(query)).toHaveLength(1);
  });

  it('should refuse a limit above 100', () => {
    expect(messagesOf({ limit: '101' })).toEqual([LIST_VALIDATION_MESSAGES.LIMIT_INVALID]);
  });
});
