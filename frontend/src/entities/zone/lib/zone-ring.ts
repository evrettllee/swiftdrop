import type { GeoPoint } from '@/shared/lib/geo';
import type { ZonePolygon } from '@/shared/staff-api';

export type LatLngLike = { lat: number; lng: number };

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

export function toZonePolygon(points: readonly LatLngLike[]): ZonePolygon {
  const ring = points.map(({ lat, lng }): [number, number] => [lng, lat]);
  const first = ring.at(0);

  return first === undefined ? [[]] : [[...ring, first]];
}

export function toLatLngs(ring: readonly GeoPoint[]): LatLngLike[] {
  return ring.map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude }));
}
