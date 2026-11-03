import { latLngBounds, type Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_ZOOM } from './map';
import { MARKERS_FIT_PADDING_BOTTOM_RIGHT, MARKERS_FIT_PADDING_TOP_LEFT } from './map-pin';

export function useFitOnce(map: LeafletMap | null, points: readonly GeoPoint[]): void {
  const isFitted = useRef(false);

  useEffect(() => {
    if (map === null || isFitted.current || points.length === 0) {
      return;
    }

    isFitted.current = true;

    if (points.length === 1) {
      map.setView(toLatLng(points[0]), MAP_ZOOM.FOCUS, { animate: false });

      return;
    }

    map.fitBounds(latLngBounds(points.map(toLatLng)), {
      paddingTopLeft: MARKERS_FIT_PADDING_TOP_LEFT,
      paddingBottomRight: MARKERS_FIT_PADDING_BOTTOM_RIGHT,
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, points]);
}
