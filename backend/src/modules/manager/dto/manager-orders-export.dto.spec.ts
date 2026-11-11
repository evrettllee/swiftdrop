import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { MANAGER_EXPORT_MESSAGES } from '../constants/manager-export.constants';
import { managerOrdersExportSchema } from './manager-orders-export.dto';

function messagesOf(query: Record<string, string>): string[] {
  const result = managerOrdersExportSchema.safeParse(query);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('managerOrdersExportSchema', () => {
  it('should take the filters and the sort of the list, without phones by default', () => {
    const result = managerOrdersExportSchema.safeParse({
      format: 'csv',
      status: 'attention',
      payment: 'unpaid',
      q: 'Петров',
      sort: 'price:asc',
    });

    expect(result.success && result.data).toEqual({
      format: 'csv',
      withPhones: false,
      status: ['attention'],
      sort: { key: 'price', direction: 'asc' },
      filters: {
        period: { start: null, end: null },
        courierId: null,
        payment: ['unpaid'],
        fragile: false,
        hasOpenTicket: false,
        search: { kind: 'text', pattern: '%Петров%' },
      },
    });
  });

  it('should sort newest first by default and take phones on request', () => {
    const result = managerOrdersExportSchema.safeParse({ format: 'xlsx', withPhones: 'true' });

    expect(result.success && result.data).toMatchObject({
      format: 'xlsx',
      withPhones: true,
      sort: { key: 'createdAt', direction: 'desc' },
    });
  });

  it('should take the open ticket filter of the list', () => {
    const result = managerOrdersExportSchema.safeParse({ format: 'csv', hasOpenTicket: 'true' });

    expect(result.success && result.data).toMatchObject({ filters: { hasOpenTicket: true } });
  });

  it('should require the format', () => {
    expect(messagesOf({})).toEqual([MANAGER_EXPORT_MESSAGES.FORMAT_INVALID]);
    expect(messagesOf({ format: 'pdf' })).toEqual([MANAGER_EXPORT_MESSAGES.FORMAT_INVALID]);
  });

  it.each(['page', 'limit', 'cursor', 'until'])(
    'should refuse the pagination parameter %s',
    (key) => {
      expect(messagesOf({ format: 'csv', [key]: '1' })).toEqual([
        `${LIST_VALIDATION_MESSAGES.UNKNOWN_PARAMETER}: ${key}`,
      ]);
    },
  );

  it.each([
    [{ withPhones: 'yes' }, MANAGER_EXPORT_MESSAGES.WITH_PHONES_INVALID],
    [{ sort: 'email:asc' }, LIST_VALIDATION_MESSAGES.SORT_INVALID],
    [{ from: '2026-10-30', to: '2026-10-01' }, LIST_VALIDATION_MESSAGES.PERIOD_INVALID],
  ])('should refuse %j', (query, message) => {
    expect(messagesOf({ format: 'csv', ...query })).toEqual([message]);
  });
});
