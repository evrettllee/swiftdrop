export type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const MONTH_OFFSET = 1;
const TWO_DIGITS = 2;

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatterOf(timeZone: string): Intl.DateTimeFormat {
  const cached = FORMATTERS.get(timeZone);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  FORMATTERS.set(timeZone, formatter);

  return formatter;
}

export function wallClock(date: Date, timeZone: string): WallClock {
  const parts = formatterOf(timeZone).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);

  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
  };
}

function pad(value: number): string {
  return String(value).padStart(TWO_DIGITS, '0');
}

export function formatWallDateTime({ year, month, day, hour, minute }: WallClock): string {
  return `${pad(day)}.${pad(month)}.${year} ${pad(hour)}:${pad(minute)}`;
}

export function formatWallDate({ year, month, day }: WallClock): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function wallClockAsUtc({ year, month, day, hour, minute }: WallClock): Date {
  return new Date(Date.UTC(year, month - MONTH_OFFSET, day, hour, minute));
}
