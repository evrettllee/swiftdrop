import { latLngBounds, type Map as LeafletMap } from 'leaflet';
import { useEffect, useEffectEvent } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_VIEW_FIT_PADDING, MAP_ZOOM } from './map';
import { linePoints, linesShapeKey } from './route-bounds';

// The route always fills the map, whatever the size of the map is. `isEnlarged` only fits the
// route again after the map is expanded or collapsed, or goes in or out of the full screen: call
// the hook after the hook of that size, so Leaflet already knows the new size. The lines are fitted
// when one appears or goes; a line that only moves with the courier does not move the map. The
// courier is fitted when they appear, not on every move, so the map does not jump.
// `paddingBottomRight` keeps the points away from the column of the controls of a map that has one.
export function useFitRoute(
  map: LeafletMap | null,
  pickup: GeoPoint,
  delivery: GeoPoint,
  courierPoint: GeoPoint | null,
  isEnlarged: boolean,
  lines: RouteLine[],
  paddingBottomRight: [number, number] = [MAP_VIEW_FIT_PADDING, MAP_VIEW_FIT_PADDING],
) {
  const [paddingRight, paddingBottom] = paddingBottomRight;
  const shapeKey = linesShapeKey(lines);
  const hasCourier = courierPoint !== null;
  const getLines = useEffectEvent(() => lines);
  const getCourierPoint = useEffectEvent(() => courierPoint);

  useEffect(() => {
    const points = [toLatLng(pickup), toLatLng(delivery), ...linePoints(getLines())];
    const courier = hasCourier ? getCourierPoint() : null;

    if (courier !== null) {
      points.push(toLatLng(courier));
    }

    map?.fitBounds(latLngBounds(points), {
      paddingTopLeft: [MAP_VIEW_FIT_PADDING, MAP_VIEW_FIT_PADDING],
      paddingBottomRight: [paddingRight, paddingBottom],
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, pickup, delivery, hasCourier, isEnlarged, shapeKey, paddingRight, paddingBottom]);
}
