import { useCallback, useMemo, useState } from 'react';
import type { AnalyticsPeriodQuery } from '@/shared/analytics-api';
import { calendarToday } from '@/shared/lib/calendar';
import { useMinuteNow } from '@/shared/lib/clock';
import { writeListParams } from '@/shared/lib/list-params';
import { ANALYTICS_PERIOD, type AnalyticsPeriod } from '../config/analytics';
import { PERIOD_PARAMS_CONFIG, type PeriodParams } from '../config/params';
import { resolvePeriod } from '../lib/period';

export type PeriodRequest = { key: string; query: AnalyticsPeriodQuery };

export type PeriodControl = {
  values: PeriodParams;
  error: string | null;
  request: PeriodRequest | null;
  search: string;
  setPeriod: (period: AnalyticsPeriod) => void;
  setFrom: (from: string | null) => void;
  setTo: (to: string | null) => void;
};

type DateDraft = { from: string | null; to: string | null; synced: string };

function useDateDraft(
  from: string | null,
  to: string | null,
  onChange: (patch: Partial<PeriodParams>) => void,
) {
  const synced = `${from}|${to}`;
  const [draft, setDraft] = useState<DateDraft>({ from, to, synced });
  let shown = draft;

  if (draft.synced !== synced) {
    shown = { from, to, synced };
    setDraft(shown);
  }

  const write = (next: DateDraft) => {
    setDraft(next);
    onChange({ from: next.from, to: next.to });
  };

  return {
    from: shown.from,
    to: shown.to,
    setFrom: (next: string | null) => write({ ...shown, from: next }),
    setTo: (next: string | null) => write({ ...shown, to: next }),
  };
}

export function useAnalyticsPeriod(
  { period, from, to }: PeriodParams,
  onChange: (patch: Partial<PeriodParams>) => void,
): PeriodControl {
  const now = useMinuteNow();
  const today = calendarToday(new Date(now));
  const values = useMemo(() => ({ period, from, to }), [period, from, to]);
  const dates = useDateDraft(from, to, onChange);
  const resolution = useMemo(() => resolvePeriod(values, today), [values, today]);
  const queryFrom = resolution.query?.from ?? null;
  const queryTo = resolution.query?.to ?? null;

  const request = useMemo(
    () =>
      queryFrom === null || queryTo === null
        ? null
        : { key: `${queryFrom}|${queryTo}`, query: { from: queryFrom, to: queryTo } },
    [queryFrom, queryTo],
  );

  const setPeriod = useCallback(
    (next: AnalyticsPeriod) =>
      onChange(
        next === ANALYTICS_PERIOD.CUSTOM
          ? { period: next, from: queryFrom ?? from, to: queryTo ?? to }
          : { period: next, from: null, to: null },
      ),
    [onChange, queryFrom, queryTo, from, to],
  );

  return {
    values: { period, from: dates.from, to: dates.to },
    error: resolution.error,
    request,
    search: writeListParams(new URLSearchParams(), values, PERIOD_PARAMS_CONFIG).toString(),
    setPeriod,
    setFrom: dates.setFrom,
    setTo: dates.setTo,
  };
}
