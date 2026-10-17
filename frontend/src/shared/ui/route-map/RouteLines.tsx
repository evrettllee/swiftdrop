import { Polyline } from 'react-leaflet';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import { MAP_CLASS } from './map';

// The lines of a route exactly as the routing service gave them, along the roads. There is no
// straight line between the points, ever: a missing line is told by RouteUnavailableBadge.
export function RouteLines({ lines }: { lines: RouteLine[] }) {
  return lines.map(({ kind, points }) => (
    <Polyline
      key={kind}
      positions={points.map(toLatLng)}
      pathOptions={{ className: MAP_CLASS.LINE, interactive: false }}
    />
  ));
}
