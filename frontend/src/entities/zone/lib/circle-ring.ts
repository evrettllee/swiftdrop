import type { GeoPoint } from '@/shared/lib/geo';

export const CIRCLE_POINTS = 64;

const METERS_PER_DEGREE_LATITUDE = 110_574;
const METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111_320;
const FULL_TURN = 2 * Math.PI;

export function metersPerDegreeLongitude(latitude: number): number {
  return METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos((latitude * Math.PI) / 180);
}

export function circleRing(
  center: GeoPoint,
  radiusM: number,
  count: number = CIRCLE_POINTS,
): GeoPoint[] {
  const longitudeScale = metersPerDegreeLongitude(center.latitude);

  return Array.from({ length: count }, (_, index) => {
    const angle = (FULL_TURN * index) / count;

    return {
      latitude: center.latitude + (radiusM * Math.sin(angle)) / METERS_PER_DEGREE_LATITUDE,
      longitude: center.longitude + (radiusM * Math.cos(angle)) / longitudeScale,
    };
  });
}

export function eastPoint(center: GeoPoint, radiusM: number): GeoPoint {
  return {
    latitude: center.latitude,
    longitude: center.longitude + radiusM / metersPerDegreeLongitude(center.latitude),
  };
}
