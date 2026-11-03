import type { GeoPoint } from '@/shared/lib/geo';
import type { ZonePolygon } from '@/shared/staff-api';

export function toRing(polygon: ZonePolygon): GeoPoint[] {
  const points = (polygon[0] ?? []).map(([longitude, latitude]) => ({ latitude, longitude }));
  const first = points.at(0);
  const last = points.at(-1);

  if (
    points.length > 1 &&
    first !== undefined &&
    last !== undefined &&
    first.latitude === last.latitude &&
    first.longitude === last.longitude
  ) {
    return points.slice(0, -1);
  }

  return points;
}
