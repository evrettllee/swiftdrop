import type { OrderStatus } from '../../../common/enums/order-status.enum';
import {
  COURIER_CONTACT_STATUSES,
  COURIER_LOCATION_STALE_MS,
} from '../constants/deliveries.constants';
import type { ClientCourierPosition, ClientCourierPositionRow } from '../types/deliveries.types';

const positionVisible = new Set<OrderStatus>(COURIER_CONTACT_STATUSES);

// More than the limit, by the database clock: exactly 60 seconds is still a live connection.
export function isPositionStale(ageMs: number): boolean {
  return ageMs > COURIER_LOCATION_STALE_MS;
}

// The last known position of the courier, however old, while the order is with them. Null once the
// order is over or before the first position.
export function toClientCourierPosition(
  row: ClientCourierPositionRow,
): ClientCourierPosition | null {
  const { currentLat, currentLng, locationUpdatedAt, positionAgeMs } = row;

  if (
    !positionVisible.has(row.status) ||
    currentLat === null ||
    currentLng === null ||
    locationUpdatedAt === null ||
    positionAgeMs === null
  ) {
    return null;
  }

  return {
    latitude: currentLat,
    longitude: currentLng,
    updatedAt: locationUpdatedAt.toISOString(),
    isStale: isPositionStale(positionAgeMs),
  };
}
