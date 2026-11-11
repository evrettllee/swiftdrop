import { Button } from '@/shared/ui/button';
import { FilterChip } from './FilterChip';

export type AppliedFilterChip<I extends string> = { id: I; name: string; value: string };

type AppliedFiltersProps<I extends string> = {
  label: string;
  resetAllLabel: string;
  removeLabel: (name: string, value: string) => string;
  filters: readonly AppliedFilterChip<I>[];
  onRemove: (id: I) => void;
  onResetAll: () => void;
};

export function AppliedFilters<I extends string>({
  label,
  resetAllLabel,
  removeLabel,
  filters,
  onRemove,
  onResetAll,
}: AppliedFiltersProps<I>) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          name={filter.name}
          value={filter.value}
          removeLabel={removeLabel(filter.name, filter.value)}
          onRemove={() => onRemove(filter.id)}
        />
      ))}
      <div className="shrink-0 [&>button]:min-h-11 [&>button]:px-2 [&>button]:text-small lg:[&>button]:min-h-9">
        <Button variant="text" onClick={onResetAll}>
          {resetAllLabel}
        </Button>
      </div>
    </div>
  );
}
