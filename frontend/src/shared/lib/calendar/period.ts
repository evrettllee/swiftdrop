import { calendarToday, shiftCalendarDate } from './calendar';

export const PERIOD_PRESET = {
  ALL: 'all',
  WEEK: 'week',
  MONTH: 'month',
  CUSTOM: 'custom',
} as const;

export type PeriodPreset = (typeof PERIOD_PRESET)[keyof typeof PERIOD_PRESET];

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  PERIOD_PRESET.ALL,
  PERIOD_PRESET.WEEK,
  PERIOD_PRESET.MONTH,
  PERIOD_PRESET.CUSTOM,
];

export const PERIOD_PRESET_DAYS = {
  [PERIOD_PRESET.WEEK]: 7,
  [PERIOD_PRESET.MONTH]: 30,
} as const;

const DAY_PART_START = 8;
const MONTH_PART_START = 5;
const MONTH_PART_END = 7;

export type Period = {
  from: string | null;
  to: string | null;
};

export function presetPeriod(preset: PeriodPreset, now: Date): Period {
  if (preset === PERIOD_PRESET.WEEK || preset === PERIOD_PRESET.MONTH) {
    return {
      from: shiftCalendarDate(calendarToday(now), 1 - PERIOD_PRESET_DAYS[preset]),
      to: null,
    };
  }

  return { from: null, to: null };
}

export function detectPreset(period: Period, now: Date): PeriodPreset {
  if (period.from === null && period.to === null) {
    return PERIOD_PRESET.ALL;
  }

  if (period.to === null) {
    for (const preset of [PERIOD_PRESET.WEEK, PERIOD_PRESET.MONTH] as const) {
      if (period.from === presetPeriod(preset, now).from) {
        return preset;
      }
    }
  }

  return PERIOD_PRESET.CUSTOM;
}

export function isPeriodValid({ from, to }: Period): boolean {
  return from === null || to === null || from <= to;
}

export function formatCalendarDay(date: string): string {
  return `${date.slice(DAY_PART_START)}.${date.slice(MONTH_PART_START, MONTH_PART_END)}`;
}

export const CALENDAR_PERIOD = {
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  ALL: 'all',
  CUSTOM: 'custom',
} as const;

export type CalendarPeriod = (typeof CALENDAR_PERIOD)[keyof typeof CALENDAR_PERIOD];

export type CalendarPreset = Exclude<CalendarPeriod, typeof CALENDAR_PERIOD.CUSTOM>;

export const CALENDAR_PERIODS: readonly CalendarPeriod[] = [
  CALENDAR_PERIOD.THIS_WEEK,
  CALENDAR_PERIOD.LAST_WEEK,
  CALENDAR_PERIOD.THIS_MONTH,
  CALENDAR_PERIOD.ALL,
  CALENDAR_PERIOD.CUSTOM,
];

const DAYS_PER_WEEK = 7;
const MONDAY_SHIFT = 6;
const MONTHS_PER_YEAR = 12;
const MONTH_DIGITS = 2;

function weekStart(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();

  return shiftCalendarDate(today, -((weekday + MONDAY_SHIFT) % DAYS_PER_WEEK));
}

function monthOf(today: string): Period {
  const year = Number(today.slice(0, MONTH_PART_START - 1));
  const month = Number(today.slice(MONTH_PART_START, MONTH_PART_END));
  const nextYear = month === MONTHS_PER_YEAR ? year + 1 : year;
  const nextMonth = String((month % MONTHS_PER_YEAR) + 1).padStart(MONTH_DIGITS, '0');

  return {
    from: `${today.slice(0, DAY_PART_START)}01`,
    to: shiftCalendarDate(`${nextYear}-${nextMonth}-01`, -1),
  };
}

export function calendarPeriod(preset: CalendarPreset, now: Date): Period {
  const today = calendarToday(now);

  if (preset === CALENDAR_PERIOD.THIS_MONTH) {
    return monthOf(today);
  }

  if (preset === CALENDAR_PERIOD.ALL) {
    return { from: null, to: null };
  }

  const start = shiftCalendarDate(
    weekStart(today),
    preset === CALENDAR_PERIOD.LAST_WEEK ? -DAYS_PER_WEEK : 0,
  );

  return { from: start, to: shiftCalendarDate(start, DAYS_PER_WEEK - 1) };
}
