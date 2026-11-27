import { APP_LOCALE } from '@/shared/config';
import { formatCount } from './count';

const PERCENT = 100;
const SECONDS_PER_MINUTE = 60;
const MIN_FRACTION_DIGITS = 0;

const decimalFormat = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 1 });
const fineFormat = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 2 });
const integerFormat = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: MIN_FRACTION_DIGITS,
  maximumFractionDigits: MIN_FRACTION_DIGITS,
});

export function formatWhole(value: number): string {
  return integerFormat.format(value);
}

export function formatDecimal(value: number): string {
  return decimalFormat.format(value);
}

export function formatFine(value: number): string {
  return fineFormat.format(value);
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

export function formatSignedPercent(change: number): string {
  return `${change > 0 ? '+' : ''}${formatCount(change)}%`;
}

export function formatDurationSeconds(totalSeconds: number): string {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(rounded / SECONDS_PER_MINUTE);
  const seconds = rounded % SECONDS_PER_MINUTE;

  if (minutes === 0) {
    return `${seconds} с`;
  }

  return seconds === 0 ? `${minutes} мин` : `${minutes} мин ${seconds} с`;
}

export function formatDurationMinutes(minutes: number): string {
  return `${formatDecimal(minutes)} мин`;
}
