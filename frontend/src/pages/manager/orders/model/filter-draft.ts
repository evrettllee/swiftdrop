import type { ManagerOrdersFilter, ManagerOrdersSort, PaymentState } from '@/shared/staff-api';
import { defaultTabSort, PERIOD_PRESET, type OrdersTab, type PeriodPreset } from '../config/list';
import type { OrdersParams } from '../config/list-params';
import { detectPreset, isPeriodValid, presetPeriod } from '../lib/period';
import { type OrdersView, sortParamOf } from './orders-view';

export type FilterDraft = {
  preset: PeriodPreset;
  from: string | null;
  to: string | null;
  courierId: number | null;
  courierName: string | null;
  payment: readonly PaymentState[];
  fragile: boolean;
  sort: ManagerOrdersSort;
};

export function draftOf(view: OrdersView, now: Date, courierName: string | null): FilterDraft {
  const { filter } = view;

  return {
    preset: detectPreset(filter, now),
    from: filter.from,
    to: filter.to,
    courierId: filter.courierId,
    courierName,
    payment: filter.payment,
    fragile: filter.fragile,
    sort: view.sort,
  };
}

export function clearedDraft(tab: OrdersTab): FilterDraft {
  return {
    preset: PERIOD_PRESET.ALL,
    from: null,
    to: null,
    courierId: null,
    courierName: null,
    payment: [],
    fragile: false,
    sort: defaultTabSort(tab),
  };
}

function draftPeriod(draft: FilterDraft, now: Date): Pick<OrdersParams, 'from' | 'to'> {
  if (draft.preset !== PERIOD_PRESET.CUSTOM) {
    return presetPeriod(draft.preset, now);
  }

  return isPeriodValid(draft) ? { from: draft.from, to: draft.to } : { from: null, to: null };
}

export function draftFilter(
  draft: FilterDraft,
  now: Date,
  search: string | null,
): ManagerOrdersFilter {
  return {
    ...draftPeriod(draft, now),
    courierId: draft.courierId,
    payment: draft.payment,
    fragile: draft.fragile,
    search,
  };
}

export function draftPatch(draft: FilterDraft, tab: OrdersTab, now: Date): Partial<OrdersParams> {
  return {
    ...draftPeriod(draft, now),
    courierId: draft.courierId,
    payment: draft.payment,
    fragile: draft.fragile,
    sort: sortParamOf(tab, draft.sort),
  };
}

export function isDraftPeriodValid(draft: FilterDraft): boolean {
  return draft.preset !== PERIOD_PRESET.CUSTOM || isPeriodValid(draft);
}
