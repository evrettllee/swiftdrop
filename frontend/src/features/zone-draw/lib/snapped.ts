import type { LatLngLike } from '@/entities/zone';
import type { GeoPoint } from '@/shared/lib/geo';

const TOLERANCE = 1e-9;

function isOnSegment(point: LatLngLike, a: GeoPoint, b: GeoPoint): boolean {
  const dx = b.longitude - a.longitude;
  const dy = b.latitude - a.latitude;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return Math.hypot(point.lng - a.longitude, point.lat - a.latitude) < TOLERANCE;
  }

  const cross = Math.abs((point.lng - a.longitude) * dy - (point.lat - a.latitude) * dx) / length;
  const along = ((point.lng - a.longitude) * dx + (point.lat - a.latitude) * dy) / length;

  return cross < TOLERANCE && along >= -TOLERANCE && along <= length + TOLERANCE;
}

export function snappedPoints(
  points: readonly LatLngLike[],
  rings: readonly (readonly GeoPoint[])[],
): LatLngLike[] {
  return points.filter((point) =>
    rings.some((ring) =>
      ring.some((vertex, index) => isOnSegment(point, vertex, ring[(index + 1) % ring.length])),
    ),
  );
}
