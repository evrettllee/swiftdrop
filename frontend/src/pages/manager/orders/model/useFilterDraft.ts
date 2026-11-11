import { useMemo, useState } from 'react';
import { PAYMENT_STATE, type PaymentState } from '@/shared/staff-api';
import { COUNTS_DRAFT_DELAY_MS, TAB_COUNT_KEY } from '../config/list';
import type { OrdersParams } from '../config/list-params';
import {
  clearedDraft,
  draftFilter,
  draftOf,
  draftPatch,
  type FilterDraft,
  isDraftPeriodValid,
} from './filter-draft';
import type { OrdersView } from './orders-view';
import { useTabCounts } from './useTabCounts';

export const PAYMENT_STATES: readonly PaymentState[] = [
  PAYMENT_STATE.PAID,
  PAYMENT_STATE.REFUNDED,
  PAYMENT_STATE.UNPAID,
];

export type ChosenCourier = { courierId: number; name: string };

export function useFilterDraft(view: OrdersView, courierName: string | null) {
  const [now] = useState(() => new Date());
  const [draft, setDraft] = useState<FilterDraft>(() => draftOf(view, now, courierName));
  const filter = useMemo(
    () => draftFilter(draft, now, view.filter.search),
    [draft, now, view.filter.search],
  );
  const { counts, isCurrent } = useTabCounts(filter, COUNTS_DRAFT_DELAY_MS);

  function change(patch: Partial<FilterDraft>): void {
    setDraft((previous) => ({ ...previous, ...patch }));
  }

  function togglePayment(state: PaymentState, isOn: boolean): void {
    setDraft((previous) => ({
      ...previous,
      payment: isOn
        ? PAYMENT_STATES.filter((item) => item === state || previous.payment.includes(item))
        : previous.payment.filter((item) => item !== state),
    }));
  }

  function result(): { patch: Partial<OrdersParams>; courier: ChosenCourier | null } {
    return {
      patch: draftPatch(draft, view.tab, now),
      courier:
        draft.courierId !== null && draft.courierName !== null
          ? { courierId: draft.courierId, name: draft.courierName }
          : null,
    };
  }

  return {
    draft,
    count: counts !== null && isCurrent ? counts[TAB_COUNT_KEY[view.tab]] : null,
    isPeriodValid: isDraftPeriodValid(draft),
    change,
    togglePayment,
    reset: () => setDraft(clearedDraft(view.tab)),
    result,
  };
}
