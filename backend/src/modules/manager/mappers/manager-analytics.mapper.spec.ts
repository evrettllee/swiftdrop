import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import type { AnalyticsActivityRow, AnalyticsKpiRow } from '../types/manager-analytics.types';
import { resolveAnalyticsPeriod } from '../utils/analytics-period';
import {
  percentOf,
  toAnalyticsSummary,
  toDays,
  toHours,
  toKpiValues,
} from './manager-analytics.mapper';

const EMPTY: AnalyticsKpiRow = {
  isCurrent: true,
  total: 0,
  delivered: 0,
  timed: 0,
  onTime: 0,
  avgDeliveryMin: null,
  cancelled: 0,
  cancelledByClient: 0,
  cancelledBySystem: 0,
  cancelledByStaff: 0,
  avgSearchMin: null,
  manual: 0,
  revenue: '0.00',
  paidOrders: 0,
  avgCheck: null,
};

const activity = (day: string, hour: number, counts: Partial<AnalyticsActivityRow>) => ({
  day,
  hour,
  delivered: 0,
  cancelled: 0,
  inProgress: 0,
  ...counts,
});

describe('toKpiValues', () => {
  it('should give percentages with one digit and minutes rounded to one digit', () => {
    const values = toKpiValues({
      ...EMPTY,
      total: 6,
      delivered: 3,
      timed: 3,
      onTime: 2,
      avgDeliveryMin: 41.26,
      cancelled: 2,
      cancelledByClient: 1,
      cancelledByStaff: 1,
      avgSearchMin: 3.04,
      manual: 1,
      revenue: '98.40',
      paidOrders: 4,
      avgCheck: '24.60',
    });

    expect(values).toEqual({
      delivered: { delivered: 3, total: 6 },
      onTime: { pct: 66.7, count: 2 },
      avgDeliveryMin: 41.3,
      cancelled: { pct: 33.3, count: 2, by: { client: 1, system: 0, staff: 1 } },
      revenue: { total: '98.40', avgCheck: '24.60', orders: 4 },
      courierSearch: { avgMin: 3, manual: 1 },
    });
  });

  it('should give null shares and averages for an empty period', () => {
    const values = toKpiValues(EMPTY);

    expect(values.onTime.pct).toBeNull();
    expect(values.cancelled.pct).toBeNull();
    expect(values.avgDeliveryMin).toBeNull();
    expect(values.courierSearch.avgMin).toBeNull();
    expect(values.revenue).toEqual({ total: '0.00', avgCheck: null, orders: 0 });
  });

  it('should count on time only among the orders with a known estimate', () => {
    expect(toKpiValues({ ...EMPTY, delivered: 4, timed: 2, onTime: 1 }).onTime.pct).toBe(50);
    expect(percentOf(1, 8)).toBe(12.5);
  });
});

describe('toAnalyticsSummary', () => {
  it('should put the current and the previous value side by side', () => {
    const period = resolveAnalyticsPeriod(
      { from: '2026-10-01', to: '2026-10-02' },
      new Date(),
      APP_TIME_ZONE,
    );
    const summary = toAnalyticsSummary(
      period,
      [
        { ...EMPTY, total: 2, delivered: 1 },
        { ...EMPTY, isCurrent: false, total: 4, delivered: 4 },
      ],
      [],
    );

    expect(summary.period).toEqual({
      from: '2026-10-01',
      to: '2026-10-02',
      previousFrom: '2026-09-29',
      previousTo: '2026-09-30',
    });
    expect(summary.kpis.delivered).toEqual({
      current: { delivered: 1, total: 2 },
      previous: { delivered: 4, total: 4 },
    });
  });
});

describe('toDays', () => {
  it('should give every day of the period, an empty one with zeros', () => {
    const days = toDays(
      [
        activity('2026-10-01', 9, { delivered: 2 }),
        activity('2026-10-01', 18, { cancelled: 1, inProgress: 1 }),
        activity('2026-10-03', 12, { inProgress: 3 }),
      ],
      '2026-10-01',
      '2026-10-03',
    );

    expect(days).toEqual([
      { date: '2026-10-01', delivered: 2, cancelled: 1, inProgress: 1 },
      { date: '2026-10-02', delivered: 0, cancelled: 0, inProgress: 0 },
      { date: '2026-10-03', delivered: 0, cancelled: 0, inProgress: 3 },
    ]);
  });
});

describe('toHours', () => {
  it('should give all 24 hours with the orders of each hour divided by the days', () => {
    const hours = toHours(
      [
        activity('2026-10-01', 9, { delivered: 2, cancelled: 1 }),
        activity('2026-10-02', 9, { inProgress: 1 }),
        activity('2026-10-02', 23, { delivered: 1 }),
      ],
      3,
    );

    expect(hours).toHaveLength(24);
    expect(hours[0]).toEqual({ hour: 0, avgOrders: 0 });
    expect(hours[9]).toEqual({ hour: 9, avgOrders: 1.33 });
    expect(hours[23]).toEqual({ hour: 23, avgOrders: 0.33 });
  });
});
