import { AppliedFilters as SharedAppliedFilters } from '@/shared/ui/chip';
import { FILTERS_RESET, type OrdersParams } from '../config/list-params';
import { ORDERS_TEXTS } from '../config/texts';
import type { AppliedFilter } from '../lib/applied-filters';

type AppliedFiltersProps = {
  filters: readonly AppliedFilter[];
  isShown: boolean;
  onChange: (patch: Partial<OrdersParams>) => void;
};

export function AppliedFilters({ filters, isShown, onChange }: AppliedFiltersProps) {
  return (
    <SharedAppliedFilters
      label={ORDERS_TEXTS.APPLIED_FILTERS}
      resetAllLabel={ORDERS_TEXTS.RESET_ALL}
      removeLabel={ORDERS_TEXTS.removeFilter}
      filters={isShown ? filters : []}
      onRemove={(id) => {
        const filter = filters.find((item) => item.id === id);

        if (filter !== undefined) {
          onChange(filter.reset);
        }
      }}
      onResetAll={() => onChange(FILTERS_RESET)}
    />
  );
}
