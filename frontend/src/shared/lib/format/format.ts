import { APP_LOCALE } from '@/shared/config';

const MONEY_FRACTION_DIGITS = 2;
const SHORT_MONTHS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

const moneyFormats = new Map<number, Intl.NumberFormat>();

function moneyFormatOf(fractionDigits: number): Intl.NumberFormat {
  let format = moneyFormats.get(fractionDigits);

  if (format === undefined) {
    format = new Intl.NumberFormat(APP_LOCALE, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    moneyFormats.set(fractionDigits, format);
  }

  return format;
}

const dayMonthFormat = new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'long' });

const timeFormat = new Intl.DateTimeFormat(APP_LOCALE, { hour: '2-digit', minute: '2-digit' });

// An exact amount, unlike the estimate in the calculator, which starts with "≈".
export function formatMoney(
  amount: number,
  currency: string,
  fractionDigits: number = MONEY_FRACTION_DIGITS,
): string {
  return `${moneyFormatOf(fractionDigits).format(amount)} ${currency}`;
}

// For example "6 октября 2026, 14:20": the date of an order on its page.
export function formatFullDateTime(date: Date): string {
  return `${dayMonthFormat.format(date)} ${date.getFullYear()}, ${timeFormat.format(date)}`;
}

// For example "6 окт, 14:20": the date in lists.
export function formatShortDateTime(date: Date): string {
  const day = formatShortDay(date);

  return `${day}, ${timeFormat.format(date)}`;
}

// For example "14:20"
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

export function formatShortDay(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

export function formatShortDate(date: Date): string {
  return `${formatShortDay(date)} ${date.getFullYear()}`;
}
