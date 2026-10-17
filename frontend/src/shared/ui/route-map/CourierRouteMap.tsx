import { Marker } from 'react-leaflet';
import { ROUTE_POINT } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import type { MapRoute } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_TEXTS, MAP_VIEW_CONTROLS_FIT_PADDING, MAP_ZOOM } from './map';
import { MARKER_ICONS } from './marker-icons';
import { MovableMapFrame } from './MovableMapFrame';
import { POSITION_ICON_STILL } from './position-icon';
import { RouteLines } from './RouteLines';
import { RouteUnavailableBadge } from './RouteUnavailableBadge';
import { useFitRoute } from './useFitRoute';
import { useMovableMap } from './useMovableMap';

type CourierRouteMapProps = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  // The way of the courier and the trip of the parcel, along the roads, when they are there.
  route: MapRoute;
  // Where the device of the courier is: the marker and «Ко мне»; null hides both.
  courierPoint: GeoPoint | null;
  // The parent sets the height of the map.
  className: string;
};

// The order the courier carries, as the map of the work page: it moves, and the wheel zooms around
// the center. The route, the points and the courier fill it when it opens and in or out of the full
// screen; a move of the courier does not move the map, «Ко мне» does.
export function CourierRouteMap({
  pickup,
  delivery,
  route,
  courierPoint,
  className,
}: CourierRouteMapProps) {
  const frame = useMovableMap();
  const { map } = frame;
  const prefersReducedMotion = usePrefersReducedMotion();
  // After useMovableMap: the route is fitted to the map once Leaflet knows its new size.
  useFitRoute(
    map,
    pickup,
    delivery,
    courierPoint,
    frame.isFullscreen,
    route.lines,
    MAP_VIEW_CONTROLS_FIT_PADDING,
  );

  // The zoom of the map of the position on the work page.
  function handleLocate(point: GeoPoint): void {
    map?.setView(toLatLng(point), MAP_ZOOM.FOCUS, { animate: !prefersReducedMotion });
  }

  return (
    <MovableMapFrame
      frame={frame}
      label={MAP_TEXTS.COURIER_ROUTE_LABEL}
      center={pickup}
      zoom={MAP_ZOOM.DEFAULT}
      onLocate={courierPoint === null ? undefined : () => handleLocate(courierPoint)}
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
      {/* Still: the courier carries an order, no orders are searched for. */}
      {courierPoint === null ? null : (
        <Marker
          position={toLatLng(courierPoint)}
          icon={POSITION_ICON_STILL}
          interactive={false}
          keyboard={false}
        />
      )}
    </MovableMapFrame>
  );
}
