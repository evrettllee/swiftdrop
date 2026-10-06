import { latLngBounds } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { GeoPoint } from '../../../shared/types';
import { MAP_FIT_PADDING, MAP_ZOOM } from '../constants/map';
import { usePrefersReducedMotion } from '../lib/useExpandedMap';
import { toLatLng } from '../lib/latLng';

type FitToPointsProps = {
  pickup: GeoPoint | null;
  delivery: GeoPoint | null;
};

// Moves the map to the points when they are not in view, for example after an address was chosen
// in a field. Points that are visible never move the map, so clicks and drags do not make it jump.
export function FitToPoints({ pickup, delivery }: FitToPointsProps) {
  const map = useMap();
  const animate = !usePrefersReducedMotion();

  useEffect(() => {
    const points = [pickup, delivery]
      .filter((point): point is GeoPoint => point !== null)
      .map(toLatLng);

    if (points.length === 0) {
      return;
    }

    const bounds = latLngBounds(points);

    if (map.getBounds().contains(bounds)) {
      return;
    }

    if (points.length === 1) {
      map.setView(bounds.getCenter(), Math.max(map.getZoom(), MAP_ZOOM.FOCUS), { animate });
    } else {
      map.fitBounds(bounds, {
        padding: [MAP_FIT_PADDING, MAP_FIT_PADDING],
        maxZoom: MAP_ZOOM.FIT_MAX,
        animate,
      });
    }
  }, [map, pickup, delivery, animate]);

  return null;
}
