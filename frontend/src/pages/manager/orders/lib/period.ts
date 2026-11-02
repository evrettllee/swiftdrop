import { APP_TIME_ZONE } from '@/shared/config';
import { PERIOD_PRESET, PERIOD_PRESET_DAYS, type PeriodPreset } from '../config/list';

const calendarFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_PART_START = 8;
const MONTH_PART_START = 5;
const MONTH_PART_END = 7;

export type Period = {
  from: string | null;
  to: string | null;
};

export function calendarToday(now: Date): string {
  return calendarFormat.format(now);
}

export function shiftCalendarDate(date: string, days: number): string {
  const shifted = new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS);

  return shifted.toISOString().slice(0, 10);
}

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
