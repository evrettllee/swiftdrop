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
