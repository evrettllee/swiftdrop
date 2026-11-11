import { useId, useMemo, useState } from 'react';
import { CALENDAR_PERIOD, CALENDAR_PERIODS } from '@/shared/lib/calendar';
import { PeriodControl, PeriodForm, type PeriodFormLayout } from '@/shared/ui/period-picker';
import { RadioCard } from '@/shared/ui/radio-card';
import type { HistoryQuery } from '../api/get-history';
import { HISTORY_COUNT_DELAY_MS, HISTORY_STATUSES, type HistoryStatus } from '../config/list';
import { DEFAULT_PERIOD_DRAFT } from '../config/list-params';
import { FILTER_TEXTS, HISTORY_TEXTS, PERIOD_LABELS, STATUS_LABELS } from '../config/texts';
import {
  draftOf,
  draftParams,
  type HistoryFilterParams,
  historyPeriod,
  historyPeriodLabel,
  type HistoryPeriodDraft,
  isDraftValid,
} from '../lib/history-period';
import { useHistoryCount } from '../model/useHistoryCount';

const PRESET_OPTIONS = CALENDAR_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }));

const STATUS_OPTIONS: readonly { value: HistoryStatus | null; label: string }[] = [
  { value: null, label: FILTER_TEXTS.ALL_STATUSES },
  ...HISTORY_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

type HistoryPeriodProps = {
  value: HistoryFilterParams;
  query: HistoryQuery;
  now: Date;
  onApply: (filters: HistoryFilterParams) => void;
};

function StatusFields({
  value,
  onChange,
}: {
  value: HistoryStatus | null;
  onChange: (status: HistoryStatus | null) => void;
}) {
  const name = useId();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-caption font-semibold text-fg-secondary uppercase">
        {FILTER_TEXTS.STATUS}
      </legend>
      {STATUS_OPTIONS.map((option) => (
        <RadioCard
          key={option.value ?? 'all'}
          name={name}
          value={option.value ?? ''}
          density="compact"
          title={option.label}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
        />
      ))}
    </fieldset>
  );
}

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

    return isValid ? { ...query, from: range.from, to: range.to, status: draft.status } : null;
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
      onReset={() => setDraft(DEFAULT_PERIOD_DRAFT)}
      onApply={() => onApply(draftParams(draft))}
    >
      <StatusFields
        value={draft.status}
        onChange={(status) => setDraft((current) => ({ ...current, status }))}
      />
    </PeriodForm>
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
      title={FILTER_TEXTS.PANEL}
      label={historyPeriodLabel(props.value)}
    >
      {(layout, close) => (
        <HistoryPeriodForm
          {...props}
          layout={layout}
          onApply={(filters) => {
            onApply(filters);
            close();
          }}
        />
      )}
    </PeriodControl>
  );
}
