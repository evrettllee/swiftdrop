import { latLng, type Map as LeafletMap } from 'leaflet';
import { useEffect, useEffectEvent } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import {
  MAP_AREA_FIT_PADDING,
  MAP_AREA_FIT_PADDING_BOTTOM,
  MAP_CONTROLS_CLEARANCE,
  MAP_ZOOM,
} from './map';
import { linePoints } from './route-bounds';

// Fits the map to the pickup point, the area, the courier and their way once Leaflet has the map:
// the window it opens in may have had no size before. A courier who moves, or their way that
// follows them, does not fit the map again, so it does not jump under the hand; one who appears
// later does.
export function useFitArea(
  map: LeafletMap | null,
  pickup: GeoPoint,
  areaCenter: GeoPoint,
  areaRadiusM: number,
  courierPoint: GeoPoint | null,
  lines: RouteLine[],
): void {
  const { latitude, longitude } = pickup;
  const { latitude: areaLatitude, longitude: areaLongitude } = areaCenter;
  const hasCourier = courierPoint !== null;
  const hasLines = lines.length > 0;
  const getCourierPoint = useEffectEvent(() => courierPoint);
  const getLinePoints = useEffectEvent(() => linePoints(lines));

  useEffect(() => {
    if (map === null) {
      return;
    }

    const bounds = latLng(areaLatitude, areaLongitude)
      .toBounds(areaRadiusM * 2)
      .extend(latLng(latitude, longitude));
    const courier = hasCourier ? getCourierPoint() : null;

    if (courier !== null) {
      bounds.extend(toLatLng(courier));
    }

    for (const point of hasLines ? getLinePoints() : []) {
      bounds.extend(point);
    }

    map.invalidateSize();
    map.fitBounds(bounds, {
      paddingTopLeft: [MAP_AREA_FIT_PADDING, MAP_AREA_FIT_PADDING],
      paddingBottomRight: [MAP_CONTROLS_CLEARANCE, MAP_AREA_FIT_PADDING_BOTTOM],
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, latitude, longitude, areaLatitude, areaLongitude, areaRadiusM, hasCourier, hasLines]);
}
