import { type ReactNode } from 'react';
import { Marker } from 'react-leaflet';
import { ROUTE_POINT } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import type { MapRoute } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_TEXTS, MAP_VIEW_CONTROLS_FIT_PADDING, MAP_ZOOM } from './map';
import { MARKER_ICONS } from './marker-icons';
import { MovableMapFrame } from './MovableMapFrame';
import { RouteLines } from './RouteLines';
import { RouteUnavailableBadge } from './RouteUnavailableBadge';
import { useFitRoute } from './useFitRoute';
import { useMovableMap } from './useMovableMap';

type RouteMapViewProps = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  // The trip of the parcel and the way of its courier, along the roads, when they are there.
  route: MapRoute;
  courierPoint?: GeoPoint | null;
  // The parent sets the height of the map.
  className: string;
  // More layers of the map, for example a pulse under the pickup point (SearchPulse).
  children?: ReactNode;
};

// The route of an order to look at: the points cannot be moved. It is a map like the others of the
// cabinet (MovableMapFrame): it moves, zooms and takes the full screen, and the route fills it when
// it opens and in or out of the full screen.
export function RouteMapView({
  pickup,
  delivery,
  route,
  courierPoint = null,
  className,
  children,
}: RouteMapViewProps) {
  const frame = useMovableMap();
  // After useMovableMap: the route is fitted to the map once Leaflet knows its new size.
  useFitRoute(
    frame.map,
    pickup,
    delivery,
    courierPoint,
    frame.isFullscreen,
    route.lines,
    MAP_VIEW_CONTROLS_FIT_PADDING,
  );

  return (
    <MovableMapFrame
      frame={frame}
      label={MAP_TEXTS.VIEW_LABEL}
      center={pickup}
      zoom={MAP_ZOOM.DEFAULT}
      overlay={route.isUnavailable ? <RouteUnavailableBadge /> : null}
      className={className}
    >
      <RouteLines lines={route.lines} />
      <Marker
        position={toLatLng(pickup)}
        icon={MARKER_ICONS[ROUTE_POINT.PICKUP]}
        interactive={false}
        keyboard={false}
      />
      <Marker
        position={toLatLng(delivery)}
        icon={MARKER_ICONS[ROUTE_POINT.DELIVERY]}
        interactive={false}
        keyboard={false}
      />
      {children}
    </MovableMapFrame>
  );
}
