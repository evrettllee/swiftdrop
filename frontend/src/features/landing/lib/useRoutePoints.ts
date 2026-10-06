import { useCallback, useState } from 'react';
import type { GeoPoint } from '../../pricing/types';
import { ROUTE_POINT } from '../constants/route-points';
import type { RoutePointKind } from '../types';

export function useRoutePoints() {
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [delivery, setDelivery] = useState<GeoPoint | null>(null);
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
