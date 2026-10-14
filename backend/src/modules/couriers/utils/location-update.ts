import {
  LOCATION_MIN_INTERVAL_MS,
  LOCATION_UPDATE_REJECTIONS,
} from '../constants/couriers-socket.constants';
import type { CourierSocketData, LocationUpdateRejection } from '../types/couriers-socket.types';

// Why a position from this socket cannot be taken now, or null when it can.
export function rejectLocationUpdate(
  data: CourierSocketData,
  nowMs: number,
): LocationUpdateRejection | null {
  let rejection: LocationUpdateRejection | null = null;

  if (nowMs >= data.sessionExpiresAtMs) {
    rejection = LOCATION_UPDATE_REJECTIONS.SESSION_EXPIRED;
  } else if (
    data.lastLocationAtMs !== null &&
    nowMs - data.lastLocationAtMs < LOCATION_MIN_INTERVAL_MS
  ) {
    rejection = LOCATION_UPDATE_REJECTIONS.TOO_FREQUENT;
  }

  return rejection;
}
