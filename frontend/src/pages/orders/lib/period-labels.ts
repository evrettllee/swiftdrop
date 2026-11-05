import {
  detectPreset,
  formatCalendarDay,
  PERIOD_PRESET,
  PERIOD_PRESET_DAYS,
  type Period,
} from '@/shared/lib/calendar';
import { FILTER_TEXTS, PERIOD_LABELS } from '../config/texts';

function customLabel({ from, to }: Period): string {
  if (from !== null && to !== null) {
    return FILTER_TEXTS.periodRange(formatCalendarDay(from), formatCalendarDay(to));
  }

  return from === null
    ? FILTER_TEXTS.periodTo(formatCalendarDay(to ?? ''))
    : FILTER_TEXTS.periodFrom(formatCalendarDay(from));
}

export function periodChipValue(period: Period, now: Date): string | null {
  const preset = detectPreset(period, now);

  if (preset === PERIOD_PRESET.ALL) {
    return null;
  }

  return preset === PERIOD_PRESET.CUSTOM
    ? customLabel(period)
    : FILTER_TEXTS.periodDays(PERIOD_PRESET_DAYS[preset]);
}

export function periodButtonLabel(period: Period, now: Date, isDesktop: boolean): string {
  const preset = detectPreset(period, now);

  if (preset === PERIOD_PRESET.CUSTOM) {
    return customLabel(period);
  }

  return isDesktop || preset === PERIOD_PRESET.ALL
    ? PERIOD_LABELS[preset]
    : FILTER_TEXTS.periodDays(PERIOD_PRESET_DAYS[preset]);
}
