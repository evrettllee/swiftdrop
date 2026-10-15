import { useCallback } from 'react';
import type { AddressParts, AddressSuggestion } from '@/shared/api';
import { POINT_ON_MAP_TEXT, ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';

type PointPlacementOptions = {
  // The point the next click on the map sets.
  clickTarget: RoutePointKind;
  setPoint: (kind: RoutePointKind, point: GeoPoint | null) => void;
  setAddress: (kind: RoutePointKind, text: string, parts: AddressParts | null) => void;
  setTarget: (kind: RoutePointKind) => void;
  cancelLookup: (kind: RoutePointKind) => void;
  startLookup: (
    kind: RoutePointKind,
    point: GeoPoint,
    onFound: (found: AddressSuggestion | null) => void,
  ) => void;
};

// Points set on the map rather than typed: by a click (`pickPoint`) or by a drag (`placePoint`).
export function usePointPlacement({
  clickTarget,
  setPoint,
  setAddress,
  setTarget,
  cancelLookup,
  startLookup,
}: PointPlacementOptions) {
  // The address is looked up for the point. While it is being found the field is empty and shows
  // the spinner; without a readable address the field names the point on the map.
  const placePoint = useCallback(
    (kind: RoutePointKind, point: GeoPoint) => {
      cancelLookup(kind);
      setPoint(kind, point);
      setAddress(kind, '', null);
      startLookup(kind, point, (found) => {
        setAddress(kind, found?.name ?? POINT_ON_MAP_TEXT, found?.parts ?? null);
      });
    },
    [cancelLookup, setPoint, setAddress, startLookup],
  );

  // After a click the next one goes to the delivery point, or to the pickup if it is still missing.
  const pickPoint = useCallback(
    (point: GeoPoint) => {
      placePoint(clickTarget, point);
      setTarget(ROUTE_POINT.DELIVERY);
    },
    [placePoint, clickTarget, setTarget],
  );

  return { placePoint, pickPoint };
}
