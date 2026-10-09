import { latLngBounds, type Map as LeafletMap } from 'leaflet';
import { useEffect } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_VIEW_FIT_PADDING, MAP_ZOOM } from './map';

// The route always fills the map, whatever the size of the map is. `isExpanded` only fits the
// route again after the map is expanded or collapsed: call the hook after useExpandedMap, so
// Leaflet already knows the new size.
export function useFitRoute(
  map: LeafletMap | null,
  pickup: GeoPoint,
  delivery: GeoPoint,
  isExpanded: boolean,
) {
  useEffect(() => {
    map?.fitBounds(latLngBounds([toLatLng(pickup), toLatLng(delivery)]), {
      padding: [MAP_VIEW_FIT_PADDING, MAP_VIEW_FIT_PADDING],
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, pickup, delivery, isExpanded]);
}
