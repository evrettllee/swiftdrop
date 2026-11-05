import { useMemo, useState } from 'react';
import { CALENDAR_PERIOD, CALENDAR_PERIODS } from '@/shared/lib/calendar';
import { PeriodControl, PeriodForm, type PeriodFormLayout } from '@/shared/ui/period-picker';
import type { HistoryQuery } from '../api/get-history';
import { HISTORY_COUNT_DELAY_MS } from '../config/list';
import { DEFAULT_PERIOD_DRAFT } from '../config/list-params';
import { FILTER_TEXTS, HISTORY_TEXTS, PERIOD_LABELS } from '../config/texts';
import {
  draftOf,
  draftParams,
  historyPeriod,
  historyPeriodLabel,
  type HistoryPeriodDraft,
  type HistoryPeriodParams,
  isDraftValid,
} from '../lib/history-period';
import { useHistoryCount } from '../model/useHistoryCount';

const PRESET_OPTIONS = CALENDAR_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }));

type HistoryPeriodProps = {
  value: HistoryPeriodParams;
  query: HistoryQuery;
  now: Date;
  onApply: (period: HistoryPeriodParams) => void;
};

function HistoryPeriodForm({
  value,
  query,
  now,
  layout,
  onApply,
}: HistoryPeriodProps & { layout: PeriodFormLayout }) {
  const [draft, setDraft] = useState<HistoryPeriodDraft>(() => draftOf(value));
  const isValid = isDraftValid(draft);
  const countQuery = useMemo<HistoryQuery | null>(() => {
    const range = historyPeriod(draftParams(draft), now);

    return isValid ? { ...query, from: range.from, to: range.to } : null;
  }, [draft, isValid, now, query]);
  const count = useHistoryCount(countQuery, HISTORY_COUNT_DELAY_MS);

  return (
    <PeriodForm
      layout={layout}
      presets={PRESET_OPTIONS}
      customValue={CALENDAR_PERIOD.CUSTOM}
      draft={draft}
      defaultDraft={DEFAULT_PERIOD_DRAFT}
      isValid={isValid}
      texts={{
        legend: FILTER_TEXTS.PERIOD,
        from: FILTER_TEXTS.PERIOD_FROM,
        to: FILTER_TEXTS.PERIOD_TO,
        invalid: FILTER_TEXTS.PERIOD_INVALID,
        apply: count === null ? HISTORY_TEXTS.SHOW_ORDERS : HISTORY_TEXTS.showOrders(count),
        reset: HISTORY_TEXTS.RESET,
      }}
      onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      onApply={() => onApply(draftParams(draft))}
    />
  );
}

export function HistoryPeriodControl({
  isDesktop,
  onApply,
  ...props
}: HistoryPeriodProps & { isDesktop: boolean }) {
  return (
    <PeriodControl
      isDesktop={isDesktop}
      title={FILTER_TEXTS.PERIOD}
      label={historyPeriodLabel(props.value)}
    >
      {(layout, close) => (
        <HistoryPeriodForm
          {...props}
          layout={layout}
          onApply={(period) => {
            onApply(period);
            close();
          }}
        />
      )}
    </PeriodControl>
  );
}
