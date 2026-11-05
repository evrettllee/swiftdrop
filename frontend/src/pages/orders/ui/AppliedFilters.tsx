import { Button } from '@/shared/ui/button';
import { FilterChip } from '@/shared/ui/chip';
import { FILTERS_RESET, type OrdersParams } from '../config/list-params';
import { ORDERS_TEXTS } from '../config/texts';
import type { AppliedFilter } from '../lib/applied-filters';

type AppliedFiltersProps = {
  filters: readonly AppliedFilter[];
  isShown: boolean;
  onChange: (patch: Partial<OrdersParams>) => void;
};

export function AppliedFilters({ filters, isShown, onChange }: AppliedFiltersProps) {
  if (!isShown || filters.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label={ORDERS_TEXTS.APPLIED_FILTERS}
      className="flex flex-wrap items-center gap-2"
    >
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          name={filter.name}
          value={filter.value}
          removeLabel={ORDERS_TEXTS.removeFilter(filter.name, filter.value)}
          onRemove={() => onChange(filter.reset)}
        />
      ))}
      <div className="shrink-0 [&>button]:min-h-11 [&>button]:px-2 [&>button]:text-small lg:[&>button]:min-h-9">
        <Button variant="text" onClick={() => onChange(FILTERS_RESET)}>
          {ORDERS_TEXTS.RESET_ALL}
        </Button>
      </div>
    </div>
  );
}
