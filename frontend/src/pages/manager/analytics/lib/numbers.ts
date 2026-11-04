import { APP_LOCALE } from '@/shared/config';
import { formatCount, pluralize } from '@/shared/lib/format';
import { MANAGER_ANALYTICS_TEXTS, ORDER_FORMS } from '../config/texts';

const PERCENT = 100;
const SECONDS_PER_MINUTE = 60;
const CLOCK_DIGITS = 2;

const decimalFormat = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 1 });
const fineFormat = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 2 });

export function formatDecimal(value: number): string {
  return decimalFormat.format(value);
}

export function formatFine(value: number): string {
  return fineFormat.format(value);
}

export function formatPercent(value: number | null): string {
  return value === null ? MANAGER_ANALYTICS_TEXTS.EMPTY : `${formatDecimal(value)}%`;
}

export function shareOf(part: number, whole: number): number | null {
  return whole === 0 ? null : Math.round((part / whole) * PERCENT);
}

export function changePercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * PERCENT);
}

export function formatChange(change: number): string {
  return `${change > 0 ? '+' : ''}${formatCount(change)}%`;
}

export function ordersWord(value: number): string {
  return Number.isInteger(value) ? pluralize(value, ORDER_FORMS) : ORDER_FORMS.few;
}

export type SearchTime = { minutes: number; seconds: number };

export function searchTime(avgMinutes: number): SearchTime {
  const total = Math.round(avgMinutes * SECONDS_PER_MINUTE);

  return {
    minutes: Math.floor(total / SECONDS_PER_MINUTE),
    seconds: total % SECONDS_PER_MINUTE,
  };
}

export function formatClock({ minutes, seconds }: SearchTime): string {
  return `${minutes}:${String(seconds).padStart(CLOCK_DIGITS, '0')}`;
}
