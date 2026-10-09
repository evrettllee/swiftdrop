import { APP_LOCALE } from '@/shared/config';

const MONEY_FRACTION_DIGITS = 2;
// "окт." becomes "окт": the short month is written without the dot.
const SHORT_MONTH_DOT = /\.$/;

const moneyFormat = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: MONEY_FRACTION_DIGITS,
  maximumFractionDigits: MONEY_FRACTION_DIGITS,
});

const dayMonthFormat = new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'long' });

const shortDateFormat = new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'short' });

const timeFormat = new Intl.DateTimeFormat(APP_LOCALE, { hour: '2-digit', minute: '2-digit' });

// An exact amount, unlike the estimate in the calculator, which starts with "≈".
export function formatMoney(amount: number, currency: string): string {
  return `${moneyFormat.format(amount)} ${currency}`;
}

// For example "6 октября 2026, 14:20": the date of an order on its page.
export function formatFullDateTime(date: Date): string {
  return `${dayMonthFormat.format(date)} ${date.getFullYear()}, ${timeFormat.format(date)}`;
}

// For example "6 окт, 14:20": the date in lists.
export function formatShortDateTime(date: Date): string {
  const day = shortDateFormat.format(date).replace(SHORT_MONTH_DOT, '');

  return `${day}, ${timeFormat.format(date)}`;
}

// For example "14:20"
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}
