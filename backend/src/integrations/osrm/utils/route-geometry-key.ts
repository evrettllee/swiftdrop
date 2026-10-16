import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import {
  COORDINATE_SEPARATOR,
  POINT_SEPARATOR,
  ROUTE_GEOMETRY_KEY_DIGITS,
  ROUTE_GEOMETRY_KEY_SEPARATOR,
} from '../constants/osrm.constants';
import type { OsrmProfile } from '../types/osrm.types';

// The cache key of a route line: the profile and the points rounded to about 10 m, so a courier
// who barely moved gets the line already found.
export function routeGeometryKey(profile: OsrmProfile, points: readonly GeoPoint[]): string {
  const path = points
    .map(
      (point) =>
        `${point.latitude.toFixed(ROUTE_GEOMETRY_KEY_DIGITS)}${COORDINATE_SEPARATOR}` +
        point.longitude.toFixed(ROUTE_GEOMETRY_KEY_DIGITS),
    )
    .join(POINT_SEPARATOR);

  return `${profile}${ROUTE_GEOMETRY_KEY_SEPARATOR}${path}`;
}
