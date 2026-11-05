import { PERIOD_PRESET, PERIOD_PRESETS, type Period } from '@/shared/lib/calendar';
import { PeriodForm as SharedPeriodForm, type PeriodFormLayout } from '@/shared/ui/period-picker';
import type { OrdersQuery } from '../api/list-orders';
import { FILTER_TEXTS, ORDERS_TEXTS, PERIOD_LABELS } from '../config/texts';
import { usePeriodDraft } from '../model/usePeriodDraft';

const PRESET_OPTIONS = PERIOD_PRESETS.map((value) => ({ value, label: PERIOD_LABELS[value] }));

type PeriodFormProps = {
  query: OrdersQuery;
  now: Date;
  layout: PeriodFormLayout;
  onApply: (period: Period) => void;
};

export function PeriodForm({ query, now, layout, onApply }: PeriodFormProps) {
  const form = usePeriodDraft(query, now);

  return (
    <SharedPeriodForm
      layout={layout}
      presets={PRESET_OPTIONS}
      customValue={PERIOD_PRESET.CUSTOM}
      draft={form.draft}
      isValid={form.isValid}
      texts={{
        legend: FILTER_TEXTS.PERIOD,
        from: FILTER_TEXTS.PERIOD_FROM,
        to: FILTER_TEXTS.PERIOD_TO,
        invalid: FILTER_TEXTS.PERIOD_INVALID,
        apply: form.count === null ? ORDERS_TEXTS.SHOW_ORDERS : ORDERS_TEXTS.showOrders(form.count),
        reset: ORDERS_TEXTS.RESET,
      }}
      onChange={form.change}
      onApply={() => onApply(form.period)}
      onReset={form.reset}
    />
  );
}
