import type { AnalyticsDay } from '@/shared/analytics-api';
import { APP_LOCALE } from '@/shared/config';
import { calendarDateToUtc } from '@/shared/lib/calendar';
import { formatCount } from '@/shared/lib/format';
import { CHART_TEXTS } from '../config/texts';
import { formatDayMonth } from './period';

const SHORT_MONTH_DOT = /\.$/;

const shortDayFormat = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
});

const dayNumberFormat = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: 'UTC', day: 'numeric' });

export function dayTotal(day: AnalyticsDay): number {
  return day.delivered + day.cancelled + day.inProgress;
}

export function dayLabel(date: string, isDesktop: boolean): string {
  const utc = calendarDateToUtc(date);

  return isDesktop
    ? shortDayFormat.format(utc).replace(SHORT_MONTH_DOT, '')
    : dayNumberFormat.format(utc);
}

export function dayText(day: AnalyticsDay): string {
  const parts = [
    CHART_TEXTS.delivered(formatCount(day.delivered)),
    CHART_TEXTS.cancelled(formatCount(day.cancelled)),
  ];

  if (day.inProgress > 0) {
    parts.push(CHART_TEXTS.inProgress(formatCount(day.inProgress)));
  }

  return `${formatDayMonth(day.date)} ${parts.join(', ')}`;
}

export function daysSummary(days: readonly AnalyticsDay[]): string {
  return CHART_TEXTS.summary(CHART_TEXTS.DAYS, days.map(dayText).join('; '));
}
