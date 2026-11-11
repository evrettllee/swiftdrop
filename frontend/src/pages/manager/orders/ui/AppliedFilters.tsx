import { Button } from '@/shared/ui/button';
import { FilterChip } from '@/shared/ui/chip';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import type { AppliedFilter } from '../model/applied-filters';
import type { OrdersParams } from '../config/list-params';
import { FILTERS_RESET } from '../model/orders-view';

type AppliedFiltersProps = {
  filters: readonly AppliedFilter[];
  onChange: (patch: Partial<OrdersParams>) => void;
};

export function AppliedFilters({ filters, onChange }: AppliedFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label={MANAGER_ORDERS_TEXTS.APPLIED_FILTERS}
      className="flex flex-wrap items-center gap-2"
    >
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          name={filter.name}
          value={filter.value}
          removeLabel={MANAGER_ORDERS_TEXTS.removeFilter(filter.name, filter.value)}
          onRemove={() => onChange(filter.reset)}
        />
      ))}
      <div className="shrink-0 [&>button]:min-h-11 [&>button]:px-2 [&>button]:text-small lg:[&>button]:min-h-9">
        <Button variant="text" onClick={() => onChange(FILTERS_RESET)}>
          {MANAGER_ORDERS_TEXTS.RESET_ALL}
        </Button>
      </div>
    </div>
  );
}
