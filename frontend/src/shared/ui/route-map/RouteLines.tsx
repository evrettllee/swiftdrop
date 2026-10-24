import { Polyline } from 'react-leaflet';
import { ROUTE_SEGMENT_KIND } from '@/shared/api';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_CLASS } from './map';

const PARCEL_LINE_CLASS = MAP_CLASS.LINE;
const COURIER_LINE_CLASS = `${MAP_CLASS.LINE} ${MAP_CLASS.LINE_LIVE}`;

// The lines of a route exactly as the routing service gave them, along the roads. There is no
// straight line between the points, ever: a missing line is told by RouteUnavailableBadge.
export function RouteLines({ lines }: { lines: RouteLine[] }) {
  return lines.map(({ kind, points }) => (
    <Polyline
      key={kind}
      positions={points.map(toLatLng)}
      pathOptions={{
        className:
          kind === ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF ? PARCEL_LINE_CLASS : COURIER_LINE_CLASS,
        interactive: false,
      }}
    />
  ));
}
