import { COURIER_POSITION_STALE_MS } from '@/entities/order';
import type { OrderStatus } from '@/shared/api';
import { MS_PER_SECOND } from '@/shared/config';
import { COURIER_MAP_STATE, type CourierMapItem, type CourierMapState } from '@/shared/staff-api';
import { MAP_FILTER, MAP_FILTER_ORDER, type MapFilter } from '../config/map';

export type LiveCourier = {
  courierId: number;
  name: string;
  phone: string | null;
  vehicleType: CourierMapItem['vehicleType'];
  lat: number | null;
  lng: number | null;
  seenAt: number | null;
  state: CourierMapState;
  activeOrder: { orderId: number; status: OrderStatus } | null;
  openOfferOrderId: number | null;
};

export type StateCounts = Record<CourierMapState, number>;

export type FilterChip = { filter: MapFilter | null; count: number };

const FILTER_STATES: Record<MapFilter, readonly CourierMapState[]> = {
  [MAP_FILTER.FREE]: [COURIER_MAP_STATE.FREE, COURIER_MAP_STATE.OFFER],
  [MAP_FILTER.ON_ORDER]: [COURIER_MAP_STATE.ON_ORDER],
  [MAP_FILTER.NO_SIGNAL]: [COURIER_MAP_STATE.NO_SIGNAL],
};

export function statesOf(filter: MapFilter | null): readonly CourierMapState[] | null {
  return filter === null ? null : FILTER_STATES[filter];
}

export function isInFilter(state: CourierMapState, filter: MapFilter | null): boolean {
  return filter === null || FILTER_STATES[filter].includes(state);
}

export function liveState(
  courier: Pick<LiveCourier, 'seenAt' | 'activeOrder' | 'openOfferOrderId'>,
  now: number,
): CourierMapState {
  if (courier.seenAt === null || now - courier.seenAt > COURIER_POSITION_STALE_MS) {
    return COURIER_MAP_STATE.NO_SIGNAL;
  }

  if (courier.activeOrder !== null) {
    return COURIER_MAP_STATE.ON_ORDER;
  }

  return courier.openOfferOrderId === null ? COURIER_MAP_STATE.FREE : COURIER_MAP_STATE.OFFER;
}

export function seenAtOf(item: CourierMapItem, receivedAt: number): number | null {
  return item.positionAgeSec === null ? null : receivedAt - item.positionAgeSec * MS_PER_SECOND;
}

export function liveCounts(
  counts: StateCounts,
  loaded: readonly CourierMapItem[],
  live: readonly LiveCourier[],
): StateCounts {
  const next = { ...counts };

  for (const item of loaded) {
    next[item.state] -= 1;
  }

  for (const courier of live) {
    next[courier.state] += 1;
  }

  return next;
}

export function filterChips(counts: StateCounts): FilterChip[] {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return [
    { filter: null, count: total },
    ...MAP_FILTER_ORDER.map((filter) => ({
      filter,
      count: FILTER_STATES[filter].reduce((sum, state) => sum + counts[state], 0),
    })),
  ];
}
