import { ROUTE_POINT, ROUTE_POINT_ORDER, type RoutePointKind } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import type {
  AddressPartsByPoint,
  AddressTexts,
  RouteAddressValue,
  RouteAddressValues,
} from '../model/route-address';

export function pickFrom<T>(
  values: RouteAddressValues,
  read: (value: RouteAddressValue) => T,
): Record<RoutePointKind, T> {
  return {
    [ROUTE_POINT.PICKUP]: read(values[ROUTE_POINT.PICKUP]),
    [ROUTE_POINT.DELIVERY]: read(values[ROUTE_POINT.DELIVERY]),
  };
}

// While a point is missing, the next click on the map and the hint name a missing point (the
// field in focus wins if its point is missing too). Without missing points the click moves the
// point of the field in focus, and the hint is hidden.
export function getClickTarget(
  pickup: GeoPoint | null,
  delivery: GeoPoint | null,
  target: RoutePointKind,
): { clickTarget: RoutePointKind; hint: RoutePointKind | null } {
  const missing = ROUTE_POINT_ORDER.filter(
    (kind) => (kind === ROUTE_POINT.PICKUP ? pickup : delivery) === null,
  );
  const clickTarget = missing.includes(target) ? target : (missing[0] ?? target);

  return { clickTarget, hint: missing.length > 0 ? clickTarget : null };
}

// The fields as they are now, for example for a draft of the order.
export function toRouteValues(
  pickup: GeoPoint | null,
  delivery: GeoPoint | null,
  texts: AddressTexts,
  parts: AddressPartsByPoint,
): RouteAddressValues {
  return {
    [ROUTE_POINT.PICKUP]: {
      point: pickup,
      text: texts[ROUTE_POINT.PICKUP],
      parts: parts[ROUTE_POINT.PICKUP],
    },
    [ROUTE_POINT.DELIVERY]: {
      point: delivery,
      text: texts[ROUTE_POINT.DELIVERY],
      parts: parts[ROUTE_POINT.DELIVERY],
    },
  };
}
