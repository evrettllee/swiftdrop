import type { VehicleType } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import {
  NAVIGATOR_COORD_DIGITS,
  NAVIGATOR_MODES,
  NAVIGATOR_PARAMS,
  NAVIGATOR_POINT_SEPARATOR,
  NAVIGATOR_POINTS_SEPARATOR,
  NAVIGATOR_URL,
} from '../config/order-steps';

// For example "53.8945,27.5486": rounded, without the zeros at the end.
function formatNavigatorPoint({ latitude, longitude }: GeoPoint): string {
  return [latitude, longitude]
    .map((value) => Number(value.toFixed(NAVIGATOR_COORD_DIGITS)))
    .join(NAVIGATOR_POINT_SEPARATOR);
}

// The navigator of Yandex Maps to the point, for the vehicle of the courier: from where the courier
// is, or, while that is not known, from where the navigator finds the device. The coordinates are
// numbers, so nothing else gets into the address.
export function buildNavigatorHref(
  to: GeoPoint,
  vehicle: VehicleType,
  from: GeoPoint | null,
): string {
  const start = from === null ? '' : formatNavigatorPoint(from);
  const route = `${start}${NAVIGATOR_POINTS_SEPARATOR}${formatNavigatorPoint(to)}`;

  return `${NAVIGATOR_URL}?${NAVIGATOR_PARAMS.ROUTE}=${route}&${NAVIGATOR_PARAMS.MODE}=${NAVIGATOR_MODES[vehicle]}`;
}
