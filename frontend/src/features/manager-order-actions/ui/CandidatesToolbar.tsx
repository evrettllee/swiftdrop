import { ArrowsDownUpIcon } from '@phosphor-icons/react';
import {
  CANDIDATE_SORT,
  type CandidateSort,
  isSearchTooShort,
  MANAGER_SEARCH_MAX_LENGTH,
} from '@/shared/staff-api';
import { ToggleChip } from '@/shared/ui/chip';
import { SearchField } from '@/shared/ui/search-field';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import { ASSIGN_TEXTS, CANDIDATE_SORT_LABELS } from '../config/texts';
import type { VehicleChip, VehicleFilter } from '../lib/candidates';

const SORT_OPTIONS = Object.values(CANDIDATE_SORT).map((sort) => ({
  value: sort,
  label: CANDIDATE_SORT_LABELS[sort],
}));

type CandidatesToolbarProps = {
  searchText: string;
  sort: CandidateSort;
  chips: readonly VehicleChip[];
  vehicle: VehicleFilter;
  onSearchChange: (text: string) => void;
  onSortChange: (sort: CandidateSort) => void;
  onVehicleChange: (vehicle: VehicleFilter) => void;
};

export function CandidatesToolbar({
  searchText,
  sort,
  chips,
  vehicle,
  onSearchChange,
  onSortChange,
  onVehicleChange,
}: CandidatesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div role="search" className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <SearchField
          value={searchText}
          label={ASSIGN_TEXTS.SEARCH_LABEL}
          placeholder={ASSIGN_TEXTS.SEARCH_PLACEHOLDER}
          clearLabel={ASSIGN_TEXTS.SEARCH_CLEAR}
          maxLength={MANAGER_SEARCH_MAX_LENGTH}
          hint={isSearchTooShort(searchText) ? ASSIGN_TEXTS.SEARCH_TOO_SHORT : null}
          className="lg:max-w-75"
          onChange={onSearchChange}
        />
        <Select<CandidateSort>
          label={ASSIGN_TEXTS.SORT_LABEL}
          labelMode={SELECT_LABEL.HIDDEN}
          icon={ArrowsDownUpIcon}
          options={SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
          className="w-full lg:w-auto"
          selectClassName="lg:w-auto lg:field-sizing-content"
        />
      </div>
      <div
        role="group"
        aria-label={ASSIGN_TEXTS.VEHICLES_LABEL}
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-visible"
      >
        {chips.map((chip) => (
          <ToggleChip
            key={chip.value}
            label={chip.label}
            count={chip.count}
            isPressed={vehicle === chip.value}
            onClick={() => onVehicleChange(chip.value)}
          />
        ))}
      </div>
    </div>
  );
}
