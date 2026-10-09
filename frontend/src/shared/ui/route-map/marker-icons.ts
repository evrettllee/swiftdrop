import { divIcon, type DivIcon } from 'leaflet';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import { MAP_CLASS, MAP_MARKER_HIT_SIZE, MAP_MARKER_TAG_OFFSET } from './map';

function createMarkerIcon(dotClass: string): DivIcon {
  return divIcon({
    className: MAP_CLASS.MARKER,
    html: `<span class="${MAP_CLASS.DOT} ${dotClass}"></span>`,
    iconSize: [MAP_MARKER_HIT_SIZE, MAP_MARKER_HIT_SIZE],
    iconAnchor: [MAP_MARKER_HIT_SIZE / 2, MAP_MARKER_HIT_SIZE / 2],
    tooltipAnchor: [0, -MAP_MARKER_TAG_OFFSET],
  });
}

// One look of the points for every map: an empty ring for the pickup, a solid dot for the delivery.
export const MARKER_ICONS: Record<RoutePointKind, DivIcon> = {
  [ROUTE_POINT.PICKUP]: createMarkerIcon(MAP_CLASS.DOT_PICKUP),
  [ROUTE_POINT.DELIVERY]: createMarkerIcon(MAP_CLASS.DOT_DELIVERY),
};
