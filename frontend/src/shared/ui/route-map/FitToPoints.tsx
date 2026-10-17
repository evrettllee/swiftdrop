import { type LatLngTuple, latLngBounds, type Map as LeafletMap } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_FIT_PADDING, MAP_ZOOM } from './map';
import { linePoints } from './route-bounds';

type FitToPointsProps = {
  pickup: GeoPoint | null;
  delivery: GeoPoint | null;
  // The line of the route, which may go outside the box of the two points.
  lines: RouteLine[];
};

// Whether every point is in view at least the fit padding away from the edge: closer to it, the tag
// above a point would be cut off.
function isInPaddedView(map: LeafletMap, points: LatLngTuple[]): boolean {
  const size = map.getSize();

  return points.every((point) => {
    const { x, y } = map.latLngToContainerPoint(point);

    return (
      x >= MAP_FIT_PADDING &&
      y >= MAP_FIT_PADDING &&
      x <= size.x - MAP_FIT_PADDING &&
      y <= size.y - MAP_FIT_PADDING
    );
  });
}

// Moves the map to the points and the route when they are not in view with the fit padding, for
// example after an address was chosen in a field or the route has come. Points that are well in
// view never move the map, so clicks and drags in its middle do not make it jump.
export function FitToPoints({ pickup, delivery, lines }: FitToPointsProps) {
  const map = useMap();
  const animate = !usePrefersReducedMotion();

  useEffect(() => {
    const points = [pickup, delivery]
      .filter((point): point is GeoPoint => point !== null)
      .map(toLatLng)
      .concat(linePoints(lines));

    if (points.length === 0) {
      return;
    }

    if (isInPaddedView(map, points)) {
      return;
    }

    const bounds = latLngBounds(points);

    if (points.length === 1) {
      map.setView(bounds.getCenter(), Math.max(map.getZoom(), MAP_ZOOM.FOCUS), { animate });
    } else {
      map.fitBounds(bounds, {
        padding: [MAP_FIT_PADDING, MAP_FIT_PADDING],
        maxZoom: MAP_ZOOM.FIT_MAX,
        animate,
      });
    }
  }, [map, pickup, delivery, lines, animate]);

  return null;
}
