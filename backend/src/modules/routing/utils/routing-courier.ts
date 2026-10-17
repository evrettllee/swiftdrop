import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import {
  COURIER_LOCATION_FRESH_MS,
  VEHICLE_ROUTING_PROFILE,
} from '../../assignment/constants/assignment.constants';
import { DEFAULT_ROUTING_PROFILE } from '../constants/routing.constants';
import type { RoutingCourier, RoutingCourierRow } from '../types/routing.types';

// The position counts only while it is fresh, by the same rule as for choosing a courier: an old
// one may be far from where the courier is now.
function freshPosition(row: RoutingCourierRow, now: Date): GeoPoint | null {
  const { currentLat, currentLng, locationUpdatedAt } = row;

  if (currentLat === null || currentLng === null || locationUpdatedAt === null) {
    return null;
  }

  return locationUpdatedAt.getTime() >= now.getTime() - COURIER_LOCATION_FRESH_MS
    ? { latitude: currentLat, longitude: currentLng }
    : null;
}

// A courier who is not found or has no vehicle goes by the default profile.
export function toRoutingCourier(row: RoutingCourierRow | undefined, now: Date): RoutingCourier {
  return {
    position: row === undefined ? null : freshPosition(row, now),
    profile: row?.vehicleType ? VEHICLE_ROUTING_PROFILE[row.vehicleType] : DEFAULT_ROUTING_PROFILE,
  };
}
