import { MS_PER_SECOND } from '@/common/constants/time.constants';
import {
  COURIER_MAP_STATE,
  type CourierMapState,
} from '../constants/manager-couriers-map.constants';
import type { CourierMapItem, CourierMapRow } from '../types/manager-couriers-map.types';

export function toCourierMapItem(row: CourierMapRow): CourierMapItem {
  return {
    courierId: row.courierId,
    name: `${row.firstName} ${row.lastName}`,
    phone: row.phone,
    vehicleType: row.vehicleType,
    lat: row.lat,
    lng: row.lng,
    positionAt: row.positionAt?.toISOString() ?? null,
    positionAgeSec:
      row.positionAgeMs === null ? null : Math.floor(row.positionAgeMs / MS_PER_SECOND),
    state: row.state,
    activeOrder:
      row.activeOrderId === null || row.activeOrderStatus === null
        ? null
        : { orderId: row.activeOrderId, status: row.activeOrderStatus },
    openOfferOrderId: row.openOfferOrderId,
  };
}

export function toCourierMapCounts(
  rows: readonly { state: CourierMapState; total: number }[],
): Record<CourierMapState, number> {
  const counts: Record<CourierMapState, number> = {
    [COURIER_MAP_STATE.FREE]: 0,
    [COURIER_MAP_STATE.ON_ORDER]: 0,
    [COURIER_MAP_STATE.OFFER]: 0,
    [COURIER_MAP_STATE.NO_SIGNAL]: 0,
  };

  for (const { state, total } of rows) {
    counts[state] = total;
  }

  return counts;
}
