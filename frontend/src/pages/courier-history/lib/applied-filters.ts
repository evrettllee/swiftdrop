import { CALENDAR_PERIOD } from '@/shared/lib/calendar';
import { type HistoryParams, PERIOD_RESET } from '../config/list-params';
import { FILTER_TEXTS } from '../config/texts';
import { historyPeriodLabel } from './history-period';

export type AppliedFilter = {
  id: 'search' | 'period';
  name: string;
  value: string;
  reset: Partial<HistoryParams>;
};

export function appliedFilters(params: HistoryParams): AppliedFilter[] {
  const result: AppliedFilter[] = [];

  if (params.q !== null) {
    result.push({ id: 'search', name: FILTER_TEXTS.SEARCH, value: params.q, reset: { q: null } });
  }

  if (params.period !== CALENDAR_PERIOD.THIS_WEEK) {
    result.push({
      id: 'period',
      name: FILTER_TEXTS.PERIOD,
      value: historyPeriodLabel(params),
      reset: PERIOD_RESET,
    });
  }

  return result;
}
