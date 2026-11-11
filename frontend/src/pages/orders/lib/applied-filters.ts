import type { OrdersParams } from '../config/list-params';
import { FILTER_TEXTS } from '../config/texts';
import { periodChipValue } from './period-labels';

export type AppliedFilter = {
  id: 'search' | 'period';
  name: string;
  value: string;
  reset: Partial<OrdersParams>;
};

export function appliedFilters(params: OrdersParams, now: Date): AppliedFilter[] {
  const result: AppliedFilter[] = [];
  const period = periodChipValue(params, now);

  if (params.q !== null) {
    result.push({ id: 'search', name: FILTER_TEXTS.SEARCH, value: params.q, reset: { q: null } });
  }

  if (period !== null) {
    result.push({
      id: 'period',
      name: FILTER_TEXTS.PERIOD,
      value: period,
      reset: { from: null, to: null },
    });
  }

  return result;
}
