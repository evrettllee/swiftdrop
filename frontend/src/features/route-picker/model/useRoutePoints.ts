import { useCallback, useState } from 'react';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';

type InitialPoints = Record<RoutePointKind, GeoPoint | null>;

// `initial` is read on the first render only, like any initial state.
export function useRoutePoints(initial?: InitialPoints) {
  const [pickup, setPickup] = useState<GeoPoint | null>(initial?.[ROUTE_POINT.PICKUP] ?? null);
  const [delivery, setDelivery] = useState<GeoPoint | null>(
    initial?.[ROUTE_POINT.DELIVERY] ?? null,
  );
  const [target, setTarget] = useState<RoutePointKind>(ROUTE_POINT.PICKUP);

  // `null` removes the point from the map.
  const setPoint = useCallback((kind: RoutePointKind, point: GeoPoint | null) => {
    if (kind === ROUTE_POINT.PICKUP) {
      setPickup(point);
    } else {
      setDelivery(point);
    }
  }, []);

  return { pickup, delivery, target, setTarget, setPoint };
}
