import { MagnifyingGlassIcon, UsersIcon } from '@phosphor-icons/react';
import { EmptyState } from '@/shared/ui/empty-state';
import type { MapFilter } from '../config/map';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import type { LiveCourier } from '../lib/courier-state';
import { CourierRow } from './CourierRow';

type CouriersListProps = {
  couriers: readonly LiveCourier[];
  now: number;
  selectedId: number | null;
  search: string | null;
  filter: MapFilter | null;
  isLoading: boolean;
  onSelect: (courierId: number) => void;
};

function emptyText(search: string | null, filter: MapFilter | null): string | null {
  if (search !== null) {
    return TEXTS.bySearch(search);
  }

  return filter === null ? null : TEXTS.BY_FILTER;
}

export function CouriersList({
  couriers,
  now,
  selectedId,
  search,
  filter,
  isLoading,
  onSelect,
}: CouriersListProps) {
  if (couriers.length === 0) {
    const text = emptyText(search, filter);

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
          courier={courier}
          now={now}
          isSelected={courier.courierId === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
