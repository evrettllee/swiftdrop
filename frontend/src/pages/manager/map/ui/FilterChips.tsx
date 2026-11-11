import { ToggleChip } from '@/shared/ui/chip';
import type { MapFilter } from '../config/map';
import { FILTER_LABELS, MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import type { FilterChip } from '../lib/courier-state';

type FilterChipsProps = {
  chips: readonly FilterChip[];
  filter: MapFilter | null;
  onChange: (filter: MapFilter | null) => void;
};

export function FilterChips({ chips, filter, onChange }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={TEXTS.FILTERS_LABEL}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      {chips.map((chip) => (
        <ToggleChip
          key={chip.filter ?? 'all'}
          label={chip.filter === null ? TEXTS.ALL : FILTER_LABELS[chip.filter]}
          count={chip.count}
          isPressed={chip.filter === filter}
          onClick={() => onChange(chip.filter)}
        />
      ))}
    </div>
  );
}
