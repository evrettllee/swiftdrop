import { MS_PER_DAY, MS_PER_SECOND } from '@/common/constants/time.constants';

export type DateRange = {
  start: Date | null;
  end: Date | null;
};

type CalendarDate = { year: number; monthIndex: number; day: number };

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_OFFSET = 1;

function parseCalendarDate(date: string): CalendarDate | null {
  const match = CALENDAR_DATE.exec(date);

  if (!match) {
    return null;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const monthIndex = month - MONTH_OFFSET;
  const utc = new Date(Date.UTC(year, monthIndex, day));
  const isReal =
    utc.getUTCFullYear() === year && utc.getUTCMonth() === monthIndex && utc.getUTCDate() === day;

  return isReal ? { year, monthIndex, day } : null;
}

export function isCalendarDate(date: string): boolean {
  return parseCalendarDate(date) !== null;
}

function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instantMs));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  const wallMs = Date.UTC(
    part('year'),
    part('month') - MONTH_OFFSET,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );

  return wallMs - Math.floor(instantMs / MS_PER_SECOND) * MS_PER_SECOND;
}

function wallMidnightToInstant(wallMs: number, timeZone: string): Date {
  const firstGuess = wallMs - zoneOffsetMs(wallMs, timeZone);

  return new Date(wallMs - zoneOffsetMs(firstGuess, timeZone));
}

function wallMidnightMs(date: string): number {
  const parsed = parseCalendarDate(date);

  if (!parsed) {
    throw new RangeError(`Not a calendar date: ${date}`);
  }

  return Date.UTC(parsed.year, parsed.monthIndex, parsed.day);
}

export function zonedDayStart(date: string, timeZone: string): Date {
  return wallMidnightToInstant(wallMidnightMs(date), timeZone);
}

export function zonedNextDayStart(date: string, timeZone: string): Date {
  return wallMidnightToInstant(wallMidnightMs(date) + MS_PER_DAY, timeZone);
}

export function toDateRange(period: { from?: string; to?: string }, timeZone: string): DateRange {
  return {
    start: period.from === undefined ? null : zonedDayStart(period.from, timeZone),
    end: period.to === undefined ? null : zonedNextDayStart(period.to, timeZone),
  };
}
