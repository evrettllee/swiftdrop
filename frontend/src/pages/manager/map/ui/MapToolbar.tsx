import type { VehicleType } from '@/shared/api';
import { isSearchTooShort, MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
import { AppliedFilters } from '@/shared/ui/chip';
import { SearchField } from '@/shared/ui/search-field';
import type { MapFilter } from '../config/map';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import type { FilterChip } from '../lib/courier-state';
import { removeVehicleType, vehicleAppliedFilters } from '../lib/vehicle';
import { FilterChips } from './FilterChips';
import { VehicleFilterControl } from './VehicleFilterControl';

type MapToolbarProps = {
  isDesktop: boolean;
  searchText: string;
  searchQuery: string | null;
  chips: readonly FilterChip[] | null;
  filter: MapFilter | null;
  vehicleTypes: readonly VehicleType[];
  committedCount: number | null;
  onSearchChange: (text: string) => void;
  onFilterChange: (filter: MapFilter | null) => void;
  onVehicleTypesChange: (vehicleTypes: VehicleType[]) => void;
};

export function MapToolbar({
  isDesktop,
  searchText,
  searchQuery,
  chips,
  filter,
  vehicleTypes,
  committedCount,
  onSearchChange,
  onFilterChange,
  onVehicleTypesChange,
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
      <div className="self-start">
        <VehicleFilterControl
          isDesktop={isDesktop}
          selected={vehicleTypes}
          state={filter}
          search={searchQuery}
          committedCount={committedCount}
          onApply={onVehicleTypesChange}
        />
      </div>
      <AppliedFilters
        label={TEXTS.APPLIED_FILTERS}
        resetAllLabel={TEXTS.RESET_ALL}
        removeLabel={TEXTS.removeFilter}
        filters={vehicleAppliedFilters(vehicleTypes)}
        onRemove={(vehicleType) =>
          onVehicleTypesChange(removeVehicleType(vehicleTypes, vehicleType))
        }
        onResetAll={() => onVehicleTypesChange([])}
      />
    </div>
  );
}
