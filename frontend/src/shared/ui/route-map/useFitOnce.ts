import { latLngBounds, type Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_ZOOM } from './map';
import {
  AREAS_FIT_PADDING_BOTTOM_RIGHT,
  AREAS_FIT_PADDING_TOP_LEFT,
  MARKERS_FIT_PADDING_BOTTOM_RIGHT,
  MARKERS_FIT_PADDING_TOP_LEFT,
} from './map-pin';

export type FitPadding = { topLeft: [number, number]; bottomRight: [number, number] };

export const MARKERS_FIT_PADDING: FitPadding = {
  topLeft: MARKERS_FIT_PADDING_TOP_LEFT,
  bottomRight: MARKERS_FIT_PADDING_BOTTOM_RIGHT,
};

export const AREAS_FIT_PADDING: FitPadding = {
  topLeft: AREAS_FIT_PADDING_TOP_LEFT,
  bottomRight: AREAS_FIT_PADDING_BOTTOM_RIGHT,
};

export function useFitOnce(
  map: LeafletMap | null,
  points: readonly GeoPoint[],
  padding: FitPadding = MARKERS_FIT_PADDING,
): void {
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
      paddingTopLeft: padding.topLeft,
      paddingBottomRight: padding.bottomRight,
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, points, padding]);
}
