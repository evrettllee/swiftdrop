import { latLngBounds, type Map as LeafletMap } from 'leaflet';
import { useEffect, useEffectEvent } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_VIEW_FIT_PADDING, MAP_ZOOM } from './map';
import { linePoints, linesShapeKey } from './route-bounds';

// The route always fills the map, whatever the size of the map is. `isExpanded` only fits the
// route again after the map is expanded or collapsed: call the hook after useExpandedMap, so
// Leaflet already knows the new size. The lines are fitted when one appears or goes; a line that
// only moves with the courier does not move the map.
export function useFitRoute(
  map: LeafletMap | null,
  pickup: GeoPoint,
  delivery: GeoPoint,
  isExpanded: boolean,
  lines: RouteLine[],
) {
  const shapeKey = linesShapeKey(lines);
  const getLines = useEffectEvent(() => lines);

  useEffect(() => {
    const points = [toLatLng(pickup), toLatLng(delivery), ...linePoints(getLines())];

    map?.fitBounds(latLngBounds(points), {
      padding: [MAP_VIEW_FIT_PADDING, MAP_VIEW_FIT_PADDING],
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, pickup, delivery, isExpanded, shapeKey]);
}
