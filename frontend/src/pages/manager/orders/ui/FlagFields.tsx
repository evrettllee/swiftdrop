import type { PaymentState } from '@/shared/staff-api';
import { Checkbox } from '@/shared/ui/checkbox';
import { RadioCard } from '@/shared/ui/radio-card';
import type { ManagerOrdersSort } from '@/shared/staff-api';
import type { OrdersTab } from '../config/list';
import { sortLabel } from '../config/sort-labels';
import { FILTER_TEXTS, MANAGER_ORDERS_TEXTS, PAYMENT_LABELS } from '../config/texts';
import type { FilterDraft } from '../model/filter-draft';
import { PAYMENT_STATES } from '../model/useFilterDraft';

const LEGEND_CLASS = 'mb-2 text-small font-semibold';

type FlagFieldsProps = {
  draft: FilterDraft;
  onToggle: (state: PaymentState, isOn: boolean) => void;
  onChange: (patch: Partial<FilterDraft>) => void;
};

export function FlagFields({ draft, onToggle, onChange }: FlagFieldsProps) {
  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className={LEGEND_CLASS}>{FILTER_TEXTS.PAYMENT}</legend>
        {PAYMENT_STATES.map((state) => (
          <Checkbox
            key={state}
            label={PAYMENT_LABELS[state]}
            checked={draft.payment.includes(state)}
            onChange={(event) => onToggle(state, event.target.checked)}
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className={LEGEND_CLASS}>{FILTER_TEXTS.PARCEL}</legend>
        <Checkbox
          label={FILTER_TEXTS.FRAGILE_ONLY}
          checked={draft.fragile}
          onChange={(event) => onChange({ fragile: event.target.checked })}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className={LEGEND_CLASS}>{FILTER_TEXTS.TICKET}</legend>
        <Checkbox
          label={FILTER_TEXTS.OPEN_TICKET_ONLY}
          checked={draft.hasOpenTicket}
          onChange={(event) => onChange({ hasOpenTicket: event.target.checked })}
        />
      </fieldset>
    </>
  );
}

type SortChoicesProps = {
  tab: OrdersTab;
  sorts: readonly ManagerOrdersSort[];
  value: ManagerOrdersSort;
  onChange: (sort: ManagerOrdersSort) => void;
};

export function SortChoices({ tab, sorts, value, onChange }: SortChoicesProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-caption font-semibold tracking-caps text-fg-secondary uppercase">
        {MANAGER_ORDERS_TEXTS.SORT}
      </legend>
      {sorts.map((sort) => (
        <RadioCard
          key={sort}
          name="manager-orders-sort"
          density="compact"
          title={sortLabel(tab, sort)}
          checked={value === sort}
          onChange={() => onChange(sort)}
        />
      ))}
    </fieldset>
  );
}
