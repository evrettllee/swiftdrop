import { APP_LOCALE, APP_TIME_ZONE } from '@/shared/config';
import { calendarDateToUtc } from './calendar';

const UTC = 'UTC';
const DASH = '–';
const SPACED_DASH = ' – ';
const YEAR_LENGTH = 4;
const YEAR_MONTH_LENGTH = 7;
const MONTH_INDEX_OFFSET = 1;

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

const minskPartsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatDayMonth(date: string): string {
  return dayMonthFormat.format(calendarDateToUtc(date));
}

export function formatDayShort(date: string): string {
  const utc = calendarDateToUtc(date);

  return `${utc.getUTCDate()} ${SHORT_MONTHS[utc.getUTCMonth()]}`;
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

export function formatDateRangeWithYear(from: string, to: string): string {
  if (from.slice(0, YEAR_LENGTH) !== to.slice(0, YEAR_LENGTH)) {
    return formatDateRange(from, to);
  }

  return `${formatDateRange(from, to)} ${from.slice(0, YEAR_LENGTH)}`;
}

export function formatMinskShortDateTime(iso: string): string {
  const parts = new Map(
    minskPartsFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  const day = Number(parts.get('day'));
  const monthIndex = Number(parts.get('month')) - MONTH_INDEX_OFFSET;
  const hour = parts.get('hour') ?? '00';
  const minute = parts.get('minute') ?? '00';

  return `${day} ${SHORT_MONTHS[monthIndex]}, ${hour}:${minute}`;
}
