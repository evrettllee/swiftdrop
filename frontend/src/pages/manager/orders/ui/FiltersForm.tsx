import { Button } from '@/shared/ui/button';
import { FILTERS_FORM_LAYOUT, type FiltersFormLayout } from '../config/filters-form';
import type { OrdersParams } from '../config/list-params';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import type { OrdersView } from '../model/orders-view';
import { type ChosenCourier, useFilterDraft } from '../model/useFilterDraft';
import { CourierField } from './CourierField';
import { FlagFields, SortChoices } from './FlagFields';
import { PeriodFields } from './PeriodFields';

type FiltersFormProps = {
  view: OrdersView;
  courierName: string | null;
  layout: FiltersFormLayout;
  onApply: (patch: Partial<OrdersParams>, courier: ChosenCourier | null) => void;
};

export function FiltersForm({ view, courierName, layout, onApply }: FiltersFormProps) {
  const form = useFilterDraft(view, courierName);
  const { draft, change } = form;
  const isSheet = layout === FILTERS_FORM_LAYOUT.SHEET;

  function apply(): void {
    const { patch, courier } = form.result();
    onApply(patch, courier);
  }

  const applyButton = (
    <Button fullWidth={isSheet} disabled={!form.isPeriodValid} onClick={apply}>
      {form.count === null
        ? MANAGER_ORDERS_TEXTS.SHOW_ORDERS
        : MANAGER_ORDERS_TEXTS.showOrders(form.count)}
    </Button>
  );
  const resetButton = (
    <Button variant={isSheet ? 'secondary' : 'text'} fullWidth={isSheet} onClick={form.reset}>
      {MANAGER_ORDERS_TEXTS.RESET}
    </Button>
  );

  return (
    <div className="flex flex-col">
      <div className={`flex flex-col gap-6 ${isSheet ? 'pb-4' : 'p-4'}`}>
        {isSheet ? (
          <SortChoices
            sorts={view.sorts}
            value={draft.sort}
            onChange={(sort) => change({ sort })}
          />
        ) : null}
        <PeriodFields draft={draft} isValid={form.isPeriodValid} onChange={change} />
        <CourierField
          courierId={draft.courierId}
          courierName={draft.courierName}
          onChange={(courier) =>
            change({ courierId: courier?.courierId ?? null, courierName: courier?.name ?? null })
          }
        />
        <FlagFields draft={draft} onToggle={form.togglePayment} onChange={change} />
      </div>
      {isSheet ? (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-surface px-4 pt-3">
          {applyButton}
          {resetButton}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-muted px-4 py-3">
          {resetButton}
          {applyButton}
        </div>
      )}
    </div>
  );
}
