import {
  analyticsCouriersSchema,
  analyticsSummarySchema,
  parseCourierSort,
} from './manager-analytics.dto';

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('analyticsSummarySchema', () => {
  it('should take a period of up to 92 days and refuse a longer one', () => {
    const longest = analyticsSummarySchema.safeParse({ from: '2026-01-01', to: '2026-04-02' });
    const tooLong = analyticsSummarySchema.safeParse({ from: '2026-01-01', to: '2026-04-03' });

    expect(longest.success).toBe(true);
    expect(messagesOf(tooLong)).toEqual(['Период аналитики: не больше 92 дней']);
  });

  it('should refuse a reversed period, a bad date and an unknown parameter', () => {
    expect(analyticsSummarySchema.safeParse({ from: '2026-02-02', to: '2026-02-01' }).success).toBe(
      false,
    );
    expect(analyticsSummarySchema.safeParse({ from: '2026-02-30' }).success).toBe(false);
    expect(analyticsSummarySchema.safeParse({ days: '7' }).success).toBe(false);
  });

  it('should leave an empty query for the default period', () => {
    expect(analyticsSummarySchema.parse({})).toEqual({});
  });
});

describe('analyticsCouriersSchema', () => {
  it('should default to the first page of 20 sorted by delivered descending', () => {
    expect(analyticsCouriersSchema.parse({})).toEqual({
      from: undefined,
      to: undefined,
      sort: { key: 'delivered', direction: 'desc' },
      page: 1,
      limit: 20,
    });
  });

  it.each([
    'onTimePct:asc',
    'avgDeliveryMin:desc',
    'declinedOffers:asc',
    'hoursOnline:desc',
    'name:asc',
  ])('should take the sort %s', (sort) => {
    expect(analyticsCouriersSchema.safeParse({ sort }).success).toBe(true);
  });

  it.each(['price:asc', 'delivered', 'delivered:up', 'delivered:asc:x'])(
    'should refuse the sort %s',
    (sort) => {
      expect(parseCourierSort(sort)).toBeNull();
      expect(analyticsCouriersSchema.safeParse({ sort }).success).toBe(false);
    },
  );

  it('should refuse a cursor, a page too deep and a limit over 100', () => {
    expect(analyticsCouriersSchema.safeParse({ cursor: '' }).success).toBe(false);
    expect(analyticsCouriersSchema.safeParse({ page: '502' }).success).toBe(false);
    expect(analyticsCouriersSchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('should check the period like the summary', () => {
    expect(
      analyticsCouriersSchema.safeParse({ from: '2026-01-01', to: '2026-04-03' }).success,
    ).toBe(false);
  });
});
