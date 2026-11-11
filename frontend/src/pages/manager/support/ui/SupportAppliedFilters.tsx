import { AppliedFilters } from '@/shared/ui/chip';
import { FILTERS_RESET } from '../config/params';
import { FILTER_TEXTS } from '../config/texts';
import { appliedFilters } from '../lib/applied-filters';
import type { SupportFilters } from '../model/support-filters';

type SupportAppliedFiltersProps = {
  value: SupportFilters;
  now: Date;
  onChange: (patch: Partial<SupportFilters>) => void;
};

export function SupportAppliedFilters({ value, now, onChange }: SupportAppliedFiltersProps) {
  const filters = appliedFilters(value, now);

  return (
    <AppliedFilters
      label={FILTER_TEXTS.APPLIED}
      resetAllLabel={FILTER_TEXTS.RESET_ALL}
      removeLabel={FILTER_TEXTS.removeFilter}
      filters={filters}
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
