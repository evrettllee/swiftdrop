import { circleRing, type LatLngLike } from '@/entities/zone';

export const SHAPE_KIND = { RING: 'ring', CIRCLE: 'circle' } as const;

export type DrawShape =
  | { kind: typeof SHAPE_KIND.RING; points: LatLngLike[] }
  | { kind: typeof SHAPE_KIND.CIRCLE; center: LatLngLike; radiusM: number };

export function shapePoints(shape: DrawShape | null): LatLngLike[] {
  if (shape === null) {
    return [];
  }

  if (shape.kind === SHAPE_KIND.RING) {
    return shape.points;
  }

  return circleRing({ latitude: shape.center.lat, longitude: shape.center.lng }, shape.radiusM).map(
    ({ latitude, longitude }) => ({ lat: latitude, lng: longitude }),
  );
}

export function sameShape(first: DrawShape | null, second: DrawShape | null): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
