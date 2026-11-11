import { Marker } from 'react-leaflet';
import { ROUTE_POINT } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import type { MapRoute } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MARKER_ICONS } from './marker-icons';
import { RouteLines } from './RouteLines';

type RouteOverlayProps = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  route: MapRoute;
};

export function RouteOverlay({ pickup, delivery, route }: RouteOverlayProps) {
  return (
    <>
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
    </>
  );
}
