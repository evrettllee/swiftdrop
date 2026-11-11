import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { datesOf, periodDays, resolveAnalyticsPeriod, shiftDate } from './analytics-period';

const LATE_EVENING_UTC = new Date('2026-10-29T22:30:00Z');

describe('resolveAnalyticsPeriod', () => {
  it('should take the last 7 days by the Minsk calendar by default', () => {
    const period = resolveAnalyticsPeriod({}, LATE_EVENING_UTC, APP_TIME_ZONE);

    expect(period.current).toMatchObject({ from: '2026-10-24', to: '2026-10-30' });
    expect(period.current.start.toISOString()).toBe('2026-10-23T21:00:00.000Z');
    expect(period.current.end.toISOString()).toBe('2026-10-30T21:00:00.000Z');
    expect(period.days).toBe(7);
  });

  it('should compare with the period of the same length right before it', () => {
    const period = resolveAnalyticsPeriod(
      { from: '2026-10-01', to: '2026-10-10' },
      LATE_EVENING_UTC,
      APP_TIME_ZONE,
    );

    expect(period.previous).toMatchObject({ from: '2026-09-21', to: '2026-09-30' });
    expect(period.previous.end).toEqual(period.current.start);
    expect(period.days).toBe(10);
  });

  it('should complete a period given by one side to 7 days', () => {
    const onlyFrom = resolveAnalyticsPeriod(
      { from: '2026-02-25' },
      LATE_EVENING_UTC,
      APP_TIME_ZONE,
    );
    const onlyTo = resolveAnalyticsPeriod({ to: '2026-03-03' }, LATE_EVENING_UTC, APP_TIME_ZONE);

    expect(onlyFrom.current).toMatchObject({ from: '2026-02-25', to: '2026-03-03' });
    expect(onlyTo.current).toMatchObject({ from: '2026-02-25', to: '2026-03-03' });
  });
});

describe('calendar days', () => {
  it('should count and list the days of a period across a month end', () => {
    expect(periodDays('2026-02-27', '2026-03-02')).toBe(4);
    expect(datesOf('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  });
});
