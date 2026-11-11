import { formatDistanceKm } from '@/entities/price';
import { APP_LOCALE } from '@/shared/config';
import { calendarDateToUtc, calendarToday, type Period } from '@/shared/lib/calendar';
import { formatCount, pluralize } from '@/shared/lib/format';
import { HISTORY_SUMMARY_TEXTS } from '../config/texts';

export type HistorySummary = { count: number; distanceKm: number };

export type SummaryLine = { lead: string; count: string; distance: string };

const YEAR_LENGTH = 4;

const dayMonth = new Intl.DateTimeFormat(APP_LOCALE, {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const dayMonthYear = new Intl.DateTimeFormat(APP_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function yearOf(date: string): string {
  return date.slice(0, YEAR_LENGTH);
}

function rangeText(from: string, to: string, now: Date): string {
  const thisYear = yearOf(calendarToday(now));
  const format = yearOf(from) === thisYear && yearOf(to) === thisYear ? dayMonth : dayMonthYear;

  return format.formatRange(calendarDateToUtc(from), calendarDateToUtc(to));
}

function periodText({ from, to }: Period, now: Date): string {
  if (from !== null && to !== null) {
    return rangeText(from, to, now);
  }

  if (from !== null) {
    return HISTORY_SUMMARY_TEXTS.since(dayMonth.format(calendarDateToUtc(from)));
  }

  return to === null
    ? HISTORY_SUMMARY_TEXTS.ALL_TIME
    : HISTORY_SUMMARY_TEXTS.until(dayMonth.format(calendarDateToUtc(to)));
}

export function summaryLine(
  period: Period,
  summary: HistorySummary | null,
  now: Date,
): SummaryLine | null {
  if (summary === null || summary.count === 0) {
    return null;
  }

  return {
    lead: HISTORY_SUMMARY_TEXTS.lead(periodText(period, now)),
    count: `${formatCount(summary.count)} ${pluralize(summary.count, HISTORY_SUMMARY_TEXTS.DELIVERY_FORMS)}`,
    distance: formatDistanceKm(summary.distanceKm),
  };
}
