import type { RouteLines, RouteSegmentKind } from '@/shared/api';
import { decodePolyline6, type GeoPoint } from '@/shared/lib/geo';

// One line of a map along the roads.
export type RouteLine = {
  kind: RouteSegmentKind;
  points: GeoPoint[];
};

// What a map draws: the lines it has, and whether a line is missing (the map says so and asks
// again). There is never a straight line instead of a missing one.
export type MapRoute = {
  lines: RouteLine[];
  isUnavailable: boolean;
};

export const NO_ROUTE: MapRoute = { lines: [], isUnavailable: false };
export const UNAVAILABLE_ROUTE: MapRoute = { lines: [], isUnavailable: true };

// A line needs two points at least; a broken polyline decodes to none and counts as missing.
const MIN_LINE_POINTS = 2;

export function toMapRoute({ segments }: RouteLines): MapRoute {
  const lines: RouteLine[] = [];

  for (const { kind, geometry } of segments) {
    const points = geometry === null ? [] : decodePolyline6(geometry);

    if (points.length >= MIN_LINE_POINTS) {
      lines.push({ kind, points });
    }
  }

  return { lines, isUnavailable: lines.length < segments.length };
}
