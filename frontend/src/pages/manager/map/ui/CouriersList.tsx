import { MagnifyingGlassIcon, UsersIcon } from '@phosphor-icons/react';
import { EmptyState } from '@/shared/ui/empty-state';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import type { LiveCourier } from '../lib/courier-state';
import { stateText } from '../lib/courier-view';
import { CourierRow } from './CourierRow';

type CouriersListProps = {
  couriers: readonly LiveCourier[];
  now: number;
  selectedId: number | null;
  search: string | null;
  hasStateFilter: boolean;
  hasVehicleFilter: boolean;
  isLoading: boolean;
  onSelect: (courierId: number) => void;
};

function emptyText(
  search: string | null,
  hasStateFilter: boolean,
  hasVehicleFilter: boolean,
): string | null {
  if (search !== null) {
    return TEXTS.bySearch(search);
  }

  if (hasVehicleFilter) {
    return TEXTS.BY_FILTERS;
  }

  return hasStateFilter ? TEXTS.BY_FILTER : null;
}

export function CouriersList({
  couriers,
  now,
  selectedId,
  search,
  hasStateFilter,
  hasVehicleFilter,
  isLoading,
  onSelect,
}: CouriersListProps) {
  if (couriers.length === 0) {
    const text = emptyText(search, hasStateFilter, hasVehicleFilter);

    return text === null ? (
      <EmptyState icon={UsersIcon} title={TEXTS.NOBODY_TITLE} text={TEXTS.NOBODY_TEXT} />
    ) : (
      <EmptyState icon={MagnifyingGlassIcon} title={TEXTS.EMPTY_TITLE} text={text} />
    );
  }

  return (
    <ul aria-busy={isLoading} className="flex flex-col">
      {couriers.map((courier) => (
        <CourierRow
          key={courier.courierId}
          courierId={courier.courierId}
          name={courier.name}
          vehicleType={courier.vehicleType}
          state={courier.state}
          stateText={stateText(courier, now)}
          isSelected={courier.courierId === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
