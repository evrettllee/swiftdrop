import { TICKET_TOPIC_LABELS } from '@/entities/support-ticket';
import {
  detectPreset,
  formatCalendarDay,
  type Period,
  PERIOD_PRESET,
  PERIOD_PRESET_DAYS,
} from '@/shared/lib/calendar';
import type { AppliedFilterChip } from '@/shared/ui/chip';
import { FILTERS_RESET } from '../config/params';
import { FILTER_TEXTS } from '../config/texts';
import { filtersPeriod, type SupportFilters } from '../model/support-filters';

export const APPLIED_FILTER = {
  TOPIC: 'topic',
  PERIOD: 'period',
} as const;

type AppliedFilterId = (typeof APPLIED_FILTER)[keyof typeof APPLIED_FILTER];

export type AppliedFilter = AppliedFilterChip<AppliedFilterId> & {
  reset: Partial<SupportFilters>;
};

function customLabel({ from, to }: Period): string {
  if (from !== null && to !== null) {
    return FILTER_TEXTS.periodRange(formatCalendarDay(from), formatCalendarDay(to));
  }

  return from === null
    ? FILTER_TEXTS.periodTo(formatCalendarDay(to ?? ''))
    : FILTER_TEXTS.periodFrom(formatCalendarDay(from));
}

export function periodLabel(period: Period, now: Date): string | null {
  const preset = detectPreset(period, now);

  if (preset === PERIOD_PRESET.ALL) {
    return null;
  }

  return preset === PERIOD_PRESET.CUSTOM
    ? customLabel(period)
    : FILTER_TEXTS.periodDays(PERIOD_PRESET_DAYS[preset]);
}

export function appliedFilters(filters: SupportFilters, now: Date): AppliedFilter[] {
  const result: AppliedFilter[] = [];
  const period = periodLabel(filtersPeriod(filters), now);

  if (filters.topic.length > 0) {
    result.push({
      id: APPLIED_FILTER.TOPIC,
      name: FILTER_TEXTS.TOPIC,
      value: filters.topic
        .map((topic) => TICKET_TOPIC_LABELS[topic].toLowerCase())
        .join(FILTER_TEXTS.SEPARATOR),
      reset: { topic: FILTERS_RESET.topic },
    });
  }

  if (period !== null) {
    result.push({
      id: APPLIED_FILTER.PERIOD,
      name: FILTER_TEXTS.PERIOD_CHIP,
      value: period,
      reset: { from: FILTERS_RESET.from, to: FILTERS_RESET.to },
    });
  }

  return result;
}
