import { type AnyColumn, type SQL, sql } from 'drizzle-orm';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { KM_PER_DEGREE } from '../constants/assignment.constants';

// The straight-line distance in kilometres from a stored position to a point, by the
// equirectangular approximation: within a city it is off by a fraction of a percent, and
// Postgres needs no extension for it.
export function approxDistanceKm(
  latitude: AnyColumn,
  longitude: AnyColumn,
  point: GeoPoint,
): SQL<number> {
  return sql<number>`${KM_PER_DEGREE}::float8 * sqrt(
    power(${latitude} - ${point.latitude}::float8, 2)
    + power((${longitude} - ${point.longitude}::float8) * cos(radians(${point.latitude}::float8)), 2)
  )`;
}
