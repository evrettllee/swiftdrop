import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { isCalendarDate, toDateRange, zonedDayStart, zonedNextDayStart } from './date-range';

describe('isCalendarDate', () => {
  it.each(['2026-10-29', '2024-02-29', '2026-12-31'])('should accept %s', (date) => {
    expect(isCalendarDate(date)).toBe(true);
  });

  it.each([
    '2026-02-29',
    '2026-13-01',
    '2026-10-32',
    '2026-1-01',
    '29.10.2026',
    '',
    '2026-10-29T00',
  ])('should reject %j', (date) => {
    expect(isCalendarDate(date)).toBe(false);
  });
});

describe('zonedDayStart', () => {
  it('should start the day at midnight in Minsk, three hours before midnight UTC', () => {
    expect(zonedDayStart('2026-10-29', APP_TIME_ZONE).toISOString()).toBe(
      '2026-10-28T21:00:00.000Z',
    );
  });

  it('should start the next day across the end of a month and of a year', () => {
    expect(zonedNextDayStart('2026-10-31', APP_TIME_ZONE).toISOString()).toBe(
      '2026-10-31T21:00:00.000Z',
    );
    expect(zonedNextDayStart('2026-12-31', APP_TIME_ZONE).toISOString()).toBe(
      '2026-12-31T21:00:00.000Z',
    );
  });

  it('should follow the zone it is given', () => {
    expect(zonedDayStart('2026-10-29', 'UTC').toISOString()).toBe('2026-10-29T00:00:00.000Z');
  });
});

describe('toDateRange', () => {
  const range = toDateRange({ from: '2026-10-29', to: '2026-10-29' }, APP_TIME_ZONE);

  function contains(instant: string): boolean {
    const time = Date.parse(instant);

    return (
      time >= (range.start?.getTime() ?? -Infinity) && time < (range.end?.getTime() ?? Infinity)
    );
  }

  it('should take one whole Minsk day as a half-open interval', () => {
    expect(contains('2026-10-28T21:00:00.000Z')).toBe(true);
    expect(contains('2026-10-29T20:59:59.999Z')).toBe(true);
  });

  it('should leave out the last moment before the day and its next midnight', () => {
    expect(contains('2026-10-28T20:59:59.999Z')).toBe(false);
    expect(contains('2026-10-29T21:00:00.000Z')).toBe(false);
  });

  it('should leave a missing side open', () => {
    expect(toDateRange({}, APP_TIME_ZONE)).toEqual({ start: null, end: null });
    expect(toDateRange({ to: '2026-10-29' }, APP_TIME_ZONE).start).toBeNull();
  });
});
