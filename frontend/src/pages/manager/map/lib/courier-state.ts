import { COURIER_POSITION_STALE_MS } from '@/entities/order';
import type { OrderStatus } from '@/shared/api';
import { APP_LOCALE, MS_PER_SECOND } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
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

export function countForFilter(counts: StateCounts, filter: MapFilter | null): number {
  const states = filter === null ? Object.values(COURIER_MAP_STATE) : FILTER_STATES[filter];

  return states.reduce((sum, state) => sum + counts[state], 0);
}

export function filterChips(counts: StateCounts): FilterChip[] {
  return [
    { filter: null, count: countForFilter(counts, null) },
    ...MAP_FILTER_ORDER.map((filter) => ({
      filter,
      count: countForFilter(counts, filter),
    })),
  ];
}

const RADIO_KEY_NEXT_RIGHT = 'ArrowRight';
const RADIO_KEY_NEXT_DOWN = 'ArrowDown';
const RADIO_KEY_PREV_LEFT = 'ArrowLeft';
const RADIO_KEY_PREV_UP = 'ArrowUp';
const RADIO_KEY_FIRST = 'Home';
const RADIO_KEY_LAST = 'End';

export function nextRadioIndex(key: string, current: number, count: number): number | null {
  if (count <= 0) {
    return null;
  }

  if (key === RADIO_KEY_FIRST) {
    return 0;
  }

  if (key === RADIO_KEY_LAST) {
    return count - 1;
  }

  if (key === RADIO_KEY_NEXT_RIGHT || key === RADIO_KEY_NEXT_DOWN) {
    return (current + 1) % count;
  }

  if (key === RADIO_KEY_PREV_LEFT || key === RADIO_KEY_PREV_UP) {
    return (current - 1 + count) % count;
  }

  return null;
}

export function pointOf(courier: LiveCourier | null): GeoPoint | null {
  return courier === null || courier.lat === null || courier.lng === null
    ? null
    : { latitude: courier.lat, longitude: courier.lng };
}

const STATE_RANK: Record<CourierMapState, number> = {
  [COURIER_MAP_STATE.ON_ORDER]: 0,
  [COURIER_MAP_STATE.OFFER]: 1,
  [COURIER_MAP_STATE.NO_SIGNAL]: 2,
  [COURIER_MAP_STATE.FREE]: 3,
};

const nameCollator = new Intl.Collator(APP_LOCALE);

export function compareCouriers(left: LiveCourier, right: LiveCourier): number {
  return (
    STATE_RANK[left.state] - STATE_RANK[right.state] ||
    nameCollator.compare(left.name, right.name) ||
    left.courierId - right.courierId
  );
}
