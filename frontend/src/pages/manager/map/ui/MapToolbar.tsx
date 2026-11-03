import { isSearchTooShort, MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
import { SearchField } from '@/shared/ui/search-field';
import type { MapFilter } from '../config/map';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import type { FilterChip } from '../lib/courier-state';
import { FilterChips } from './FilterChips';

type MapToolbarProps = {
  searchText: string;
  chips: readonly FilterChip[] | null;
  filter: MapFilter | null;
  onSearchChange: (text: string) => void;
  onFilterChange: (filter: MapFilter | null) => void;
};

export function MapToolbar({
  searchText,
  chips,
  filter,
  onSearchChange,
  onFilterChange,
}: MapToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div role="search">
        <SearchField
          value={searchText}
          label={TEXTS.SEARCH_LABEL}
          placeholder={TEXTS.SEARCH_PLACEHOLDER}
          clearLabel={TEXTS.SEARCH_CLEAR}
          maxLength={MANAGER_SEARCH_MAX_LENGTH}
          hint={isSearchTooShort(searchText) ? TEXTS.SEARCH_TOO_SHORT : null}
          onChange={onSearchChange}
        />
      </div>
      {chips === null ? null : (
        <FilterChips chips={chips} filter={filter} onChange={onFilterChange} />
      )}
    </div>
  );
}
