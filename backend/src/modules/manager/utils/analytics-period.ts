import { MS_PER_DAY } from '@/common/constants/time.constants';
import { zonedDayStart, zonedNextDayStart } from '@/common/utils/date-range';
import { formatWallDate, wallClock } from '@/common/utils/wall-clock';
import { ANALYTICS_PERIOD } from '../constants/manager-analytics.constants';
import type { AnalyticsPeriod, AnalyticsRange } from '../types/manager-analytics.types';

const DATE_LENGTH = 10;

function dayMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function shiftDate(date: string, days: number): string {
  return new Date(dayMs(date) + days * MS_PER_DAY).toISOString().slice(0, DATE_LENGTH);
}

export function periodDays(from: string, to: string): number {
  return Math.round((dayMs(to) - dayMs(from)) / MS_PER_DAY) + 1;
}

export function datesOf(from: string, to: string): string[] {
  return Array.from({ length: periodDays(from, to) }, (_, index) => shiftDate(from, index));
}

function toRange(from: string, to: string, timeZone: string): AnalyticsRange {
  return {
    from,
    to,
    start: zonedDayStart(from, timeZone),
    end: zonedNextDayStart(to, timeZone),
  };
}

export function resolveAnalyticsPeriod(
  query: { from?: string; to?: string },
  now: Date,
  timeZone: string,
): AnalyticsPeriod {
  const today = formatWallDate(wallClock(now, timeZone));
  const to =
    query.to ?? (query.from ? shiftDate(query.from, ANALYTICS_PERIOD.DEFAULT_DAYS - 1) : today);
  const from = query.from ?? shiftDate(to, 1 - ANALYTICS_PERIOD.DEFAULT_DAYS);
  const days = periodDays(from, to);

  return {
    current: toRange(from, to, timeZone),
    previous: toRange(shiftDate(from, -days), shiftDate(from, -1), timeZone),
    days,
  };
}
