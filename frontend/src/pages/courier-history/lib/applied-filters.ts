import { CALENDAR_PERIOD } from '@/shared/lib/calendar';
import { type HistoryParams, PERIOD_RESET, STATUS_RESET } from '../config/list-params';
import { FILTER_TEXTS, STATUS_LABELS } from '../config/texts';
import { historyPeriodLabel } from './history-period';

export const APPLIED_FILTER = {
  SEARCH: 'search',
  PERIOD: 'period',
  STATUS: 'status',
} as const;

type AppliedFilterId = (typeof APPLIED_FILTER)[keyof typeof APPLIED_FILTER];

export type AppliedFilter = {
  id: AppliedFilterId;
  name: string;
  value: string;
  reset: Partial<HistoryParams>;
};

export function appliedFilters(params: HistoryParams): AppliedFilter[] {
  const result: AppliedFilter[] = [];

  if (params.q !== null) {
    result.push({
      id: APPLIED_FILTER.SEARCH,
      name: FILTER_TEXTS.SEARCH,
      value: params.q,
      reset: { q: null },
    });
  }

  if (params.period !== CALENDAR_PERIOD.THIS_WEEK) {
    result.push({
      id: APPLIED_FILTER.PERIOD,
      name: FILTER_TEXTS.PERIOD,
      value: historyPeriodLabel(params),
      reset: PERIOD_RESET,
    });
  }

  if (params.status !== null) {
    result.push({
      id: APPLIED_FILTER.STATUS,
      name: FILTER_TEXTS.STATUS,
      value: STATUS_LABELS[params.status].toLowerCase(),
      reset: STATUS_RESET,
    });
  }

  return result;
}
