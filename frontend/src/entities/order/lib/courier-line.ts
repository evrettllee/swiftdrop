import { ROUTE_SEGMENT_KIND, type RouteSegmentKind } from '@/shared/api';
import { decodePolyline6 } from '@/shared/lib/geo';
import type { MapRoute } from '@/shared/lib/route-lines';
import { COURIER_LEG_TARGET, type CourierLeg } from '@/shared/realtime';

const SEGMENT_OF_LEG: Record<CourierLeg['toPoint'], RouteSegmentKind> = {
  [COURIER_LEG_TARGET.PICKUP]: ROUTE_SEGMENT_KIND.TO_PICKUP,
  [COURIER_LEG_TARGET.DROPOFF]: ROUTE_SEGMENT_KIND.TO_DROPOFF,
};

// A line needs two points at least; a broken polyline decodes to none.
const MIN_LINE_POINTS = 2;

// The route of the order with the line of the courier the page knows now: the trip of the parcel as
// the route answered, the way of the courier as the last estimate drew it (order:eta replaces it
// without asking for the route again). A missing line of the courier keeps the badge of the route;
// the line coming later takes it away, unless the trip of the parcel is missing too.
export function withCourierLine(route: MapRoute, leg: CourierLeg | null): MapRoute {
  const parcelLines = route.lines.filter(
    ({ kind }) => kind === ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
  );
  const points = leg === null ? [] : decodePolyline6(leg.geometry);

  if (leg === null || points.length < MIN_LINE_POINTS) {
    return { ...route, lines: parcelLines };
  }

  return {
    lines: [...parcelLines, { kind: SEGMENT_OF_LEG[leg.toPoint], points }],
    // Only the trip of the parcel can still be missing.
    isUnavailable: route.isUnavailable && parcelLines.length === 0,
  };
}
