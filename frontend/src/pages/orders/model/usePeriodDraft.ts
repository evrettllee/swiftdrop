import { useMemo, useState } from 'react';
import type { Period } from '@/shared/lib/calendar';
import type { OrdersQuery } from '../api/list-orders';
import { COUNTS_DRAFT_DELAY_MS } from '../config/list';
import { draftOf, draftPeriod, isDraftValid, type PeriodDraft } from '../lib/period-draft';
import { useDraftCount } from './useOrderCounts';

export function usePeriodDraft(query: OrdersQuery, now: Date) {
  const [draft, setDraft] = useState<PeriodDraft>(() => draftOf(query, now));
  const isValid = isDraftValid(draft);
  const { preset, from, to } = draft;
  const period = useMemo<Period>(
    () => draftPeriod({ preset, from, to }, now),
    [preset, from, to, now],
  );
  const countQuery = useMemo<OrdersQuery | null>(
    () => (isValid ? { ...query, from: period.from, to: period.to } : null),
    [isValid, query, period],
  );
  const count = useDraftCount(countQuery, COUNTS_DRAFT_DELAY_MS);

  return {
    draft,
    isValid,
    period,
    count,
    change: (patch: Partial<PeriodDraft>) => setDraft((value) => ({ ...value, ...patch })),
  };
}
