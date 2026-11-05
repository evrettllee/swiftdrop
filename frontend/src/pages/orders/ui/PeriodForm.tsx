import { useId } from 'react';
import { PERIOD_PRESET, PERIOD_PRESETS, type Period } from '@/shared/lib/calendar';
import { Button } from '@/shared/ui/button';
import { DateField } from '@/shared/ui/date-field';
import { RadioCard } from '@/shared/ui/radio-card';
import type { OrdersQuery } from '../api/list-orders';
import { FILTER_TEXTS, ORDERS_TEXTS, PERIOD_LABELS } from '../config/texts';
import { usePeriodDraft } from '../model/usePeriodDraft';

export type PeriodFormLayout = 'panel' | 'sheet';

type PeriodFormProps = {
  query: OrdersQuery;
  now: Date;
  layout: PeriodFormLayout;
  onApply: (period: Period) => void;
};

export function PeriodForm({ query, now, layout, onApply }: PeriodFormProps) {
  const name = useId();
  const form = usePeriodDraft(query, now);
  const { draft, change } = form;
  const isSheet = layout === 'sheet';
  const applyButton = (
    <Button fullWidth={isSheet} disabled={!form.isValid} onClick={() => onApply(form.period)}>
      {form.count === null ? ORDERS_TEXTS.SHOW_ORDERS : ORDERS_TEXTS.showOrders(form.count)}
    </Button>
  );
  const resetButton = (
    <Button variant={isSheet ? 'secondary' : 'text'} fullWidth={isSheet} onClick={form.reset}>
      {ORDERS_TEXTS.RESET}
    </Button>
  );

  return (
    <div className="flex flex-col">
      <div className={`flex flex-col gap-4 ${isSheet ? 'pb-4' : 'p-4'}`}>
        <fieldset className="flex flex-col gap-2">
          <legend
            className={
              isSheet ? 'sr-only' : 'mb-2 text-caption font-semibold text-fg-secondary uppercase'
            }
          >
            {FILTER_TEXTS.PERIOD}
          </legend>
          {PERIOD_PRESETS.map((preset) => (
            <RadioCard
              key={preset}
              name={name}
              value={preset}
              density="compact"
              title={PERIOD_LABELS[preset]}
              checked={draft.preset === preset}
              onChange={() => change({ preset })}
            />
          ))}
        </fieldset>
        {draft.preset === PERIOD_PRESET.CUSTOM ? (
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label={FILTER_TEXTS.PERIOD_FROM}
              value={draft.from}
              onChange={(from) => change({ from })}
              error={form.isValid ? undefined : FILTER_TEXTS.PERIOD_INVALID}
            />
            <DateField
              label={FILTER_TEXTS.PERIOD_TO}
              value={draft.to}
              onChange={(to) => change({ to })}
            />
          </div>
        ) : null}
      </div>
      {isSheet ? (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-surface px-4 pt-3">
          {applyButton}
          {resetButton}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          {resetButton}
          {applyButton}
        </div>
      )}
    </div>
  );
}
