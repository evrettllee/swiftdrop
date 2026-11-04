import { ANALYTICS_MAX_DAYS, type AnalyticsPeriodQuery } from '@/shared/analytics-api';
import { APP_LOCALE } from '@/shared/config';
import { calendarDateToUtc, calendarDays, shiftCalendarDate } from '@/shared/lib/calendar';
import { ANALYTICS_PERIOD, PRESET_DAYS } from '../config/analytics';
import type { PeriodParams } from '../config/params';
import { MANAGER_ANALYTICS_TEXTS, PERIOD_TEXTS } from '../config/texts';

const UTC = 'UTC';
const DASH = '–';
const SPACED_DASH = ' – ';
const YEAR_LENGTH = 4;
const YEAR_MONTH_LENGTH = 7;

const dayMonthFormat = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: UTC,
  day: 'numeric',
  month: 'long',
});

const dayMonthYearFormat = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: UTC,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dayFormat = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: UTC, day: 'numeric' });

export type PeriodResolution =
  { query: AnalyticsPeriodQuery; error: null } | { query: null; error: string };

export function resolvePeriod(params: PeriodParams, today: string): PeriodResolution {
  if (params.period !== ANALYTICS_PERIOD.CUSTOM) {
    return {
      query: { from: shiftCalendarDate(today, 1 - PRESET_DAYS[params.period]), to: today },
      error: null,
    };
  }

  const { from, to } = params;

  if (from === null || to === null) {
    return { query: null, error: PERIOD_TEXTS.REQUIRED };
  }

  if (from > to) {
    return { query: null, error: PERIOD_TEXTS.REVERSED };
  }

  if (calendarDays(from, to) > ANALYTICS_MAX_DAYS) {
    return { query: null, error: PERIOD_TEXTS.TOO_LONG };
  }

  return { query: { from, to }, error: null };
}

export function formatDayMonth(date: string): string {
  return dayMonthFormat.format(calendarDateToUtc(date));
}

export function formatDateRange(from: string, to: string): string {
  if (from === to) {
    return formatDayMonth(from);
  }

  if (from.slice(0, YEAR_LENGTH) !== to.slice(0, YEAR_LENGTH)) {
    const [start, end] = [from, to].map((date) =>
      dayMonthYearFormat.format(calendarDateToUtc(date)),
    );

    return `${start}${SPACED_DASH}${end}`;
  }

  if (from.slice(0, YEAR_MONTH_LENGTH) === to.slice(0, YEAR_MONTH_LENGTH)) {
    return `${dayFormat.format(calendarDateToUtc(from))}${DASH}${formatDayMonth(to)}`;
  }

  return `${formatDayMonth(from)}${SPACED_DASH}${formatDayMonth(to)}`;
}

export function summaryLine(range: {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}): string {
  return MANAGER_ANALYTICS_TEXTS.periodLine(
    formatDateRange(range.from, range.to),
    formatDateRange(range.previousFrom, range.previousTo),
  );
}
