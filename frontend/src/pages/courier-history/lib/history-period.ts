import {
  CALENDAR_PERIOD,
  calendarPeriod,
  formatCalendarDay,
  isPeriodValid,
  type Period,
} from '@/shared/lib/calendar';
import type { PeriodDraftOf } from '@/shared/ui/period-picker';
import type { HistoryParams } from '../config/list-params';
import { FILTER_TEXTS, PERIOD_LABELS } from '../config/texts';

export type HistoryPeriodParams = Pick<HistoryParams, 'period' | 'from' | 'to'>;

export type HistoryPeriodDraft = PeriodDraftOf<HistoryParams['period']>;

export function historyPeriod({ period, from, to }: HistoryPeriodParams, now: Date): Period {
  return period === CALENDAR_PERIOD.CUSTOM ? { from, to } : calendarPeriod(period, now);
}

function customLabel({ from, to }: Period): string {
  if (from !== null && to !== null) {
    return FILTER_TEXTS.periodRange(formatCalendarDay(from), formatCalendarDay(to));
  }

  if (from !== null) {
    return FILTER_TEXTS.periodFrom(formatCalendarDay(from));
  }

  return to === null
    ? PERIOD_LABELS[CALENDAR_PERIOD.ALL]
    : FILTER_TEXTS.periodTo(formatCalendarDay(to));
}

export function historyPeriodLabel(params: HistoryPeriodParams): string {
  return params.period === CALENDAR_PERIOD.CUSTOM
    ? customLabel(params)
    : PERIOD_LABELS[params.period];
}

export function draftOf({ period, from, to }: HistoryPeriodParams): HistoryPeriodDraft {
  return { preset: period, from, to };
}

export function isDraftValid(draft: HistoryPeriodDraft): boolean {
  return draft.preset !== CALENDAR_PERIOD.CUSTOM || isPeriodValid(draft);
}

export function draftParams({ preset, from, to }: HistoryPeriodDraft): HistoryPeriodParams {
  return preset === CALENDAR_PERIOD.CUSTOM
    ? { period: preset, from, to }
    : { period: preset, from: null, to: null };
}
