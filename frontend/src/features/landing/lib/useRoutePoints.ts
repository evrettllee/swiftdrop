import { useCallback, useState } from 'react';
import type { GeoPoint } from '../../pricing/types';
import { ROUTE_POINT } from '../constants';
import type { RoutePointKind } from '../types';

// The two points of the route and the point that the next click on the map sets.
export function useRoutePoints() {
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [delivery, setDelivery] = useState<GeoPoint | null>(null);
  const [target, setTarget] = useState<RoutePointKind>(ROUTE_POINT.PICKUP);

  const setPoint = useCallback((kind: RoutePointKind, point: GeoPoint) => {
    if (kind === ROUTE_POINT.PICKUP) {
      setPickup(point);
    } else {
      setDelivery(point);
    }
  }, []);

  // After the pickup is placed, the next click goes to the delivery point.
  const pickPoint = useCallback(
    (point: GeoPoint) => {
      setPoint(target, point);

      if (target === ROUTE_POINT.PICKUP) {
        setTarget(ROUTE_POINT.DELIVERY);
      }
    },
    [setPoint, target],
  );

  return { pickup, delivery, target, setTarget, setPoint, pickPoint };
}
