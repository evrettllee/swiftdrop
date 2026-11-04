import { APP_TIME_ZONE } from '@/shared/config';

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CALENDAR_DATE_LENGTH = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const calendarFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dayMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE.test(value)) {
    return false;
  }

  const date = new Date(dayMs(value));

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function calendarToday(now: Date): string {
  return calendarFormat.format(now);
}

export function shiftCalendarDate(date: string, days: number): string {
  return new Date(dayMs(date) + days * DAY_MS).toISOString().slice(0, CALENDAR_DATE_LENGTH);
}

export function calendarDays(from: string, to: string): number {
  return Math.round((dayMs(to) - dayMs(from)) / DAY_MS) + 1;
}

export function calendarDateToUtc(date: string): Date {
  return new Date(dayMs(date));
}
