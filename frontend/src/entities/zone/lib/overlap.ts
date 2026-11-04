import type { GeoPoint } from '@/shared/lib/geo';
import {
  midpoint,
  onSegment,
  orientation,
  type ScaledPoint,
  scaledPoint,
  segmentsCross,
} from './planar';

const POSITION = { INSIDE: 'inside', OUTSIDE: 'outside', BOUNDARY: 'boundary' } as const;

type Position = (typeof POSITION)[keyof typeof POSITION];

function scaledRing(ring: readonly GeoPoint[]): ScaledPoint[] {
  return ring.map(({ latitude, longitude }) => scaledPoint([longitude, latitude]));
}

function edges(ring: readonly ScaledPoint[]): [ScaledPoint, ScaledPoint][] {
  return ring.map((point, index) => [point, ring[(index + 1) % ring.length]]);
}

function positionIn(point: ScaledPoint, ring: readonly ScaledPoint[]): Position {
  let winding = 0;

  for (const [a, b] of edges(ring)) {
    const side = orientation(a, b, point);

    if (side === 0 && onSegment(a, b, point)) {
      return POSITION.BOUNDARY;
    }

    if (a[1] <= point[1] && b[1] > point[1] && side > 0) {
      winding += 1;
    } else if (b[1] <= point[1] && a[1] > point[1] && side < 0) {
      winding -= 1;
    }
  }

  return winding === 0 ? POSITION.OUTSIDE : POSITION.INSIDE;
}

function probes(ring: readonly ScaledPoint[]): ScaledPoint[] {
  return [...ring, ...edges(ring).map(([a, b]) => midpoint(a, b))];
}

function hasPointInside(from: readonly ScaledPoint[], into: readonly ScaledPoint[]): boolean {
  return probes(from).some((point) => positionIn(point, into) === POSITION.INSIDE);
}

function isSameRing(first: readonly ScaledPoint[], second: readonly ScaledPoint[]): boolean {
  const keys = new Set(first.map(([x, y]) => `${x}:${y}`));

  return first.length === second.length && second.every(([x, y]) => keys.has(`${x}:${y}`));
}

export function ringsOverlap(first: readonly GeoPoint[], second: readonly GeoPoint[]): boolean {
  if (first.length < 3 || second.length < 3) {
    return false;
  }

  const a = scaledRing(first);
  const b = scaledRing(second);
  const crosses = edges(a).some(([p, q]) => edges(b).some(([r, s]) => segmentsCross(p, q, r, s)));

  return crosses || hasPointInside(a, b) || hasPointInside(b, a) || isSameRing(a, b);
}

export type ZoneRank = { id: number | null; priority: number };

export const OVERLAP_WINNER = { SUBJECT: 'subject', OTHER: 'other' } as const;

export type OverlapWinner = (typeof OVERLAP_WINNER)[keyof typeof OVERLAP_WINNER];

export function overlapWinner(subject: ZoneRank, other: ZoneRank): OverlapWinner {
  if (subject.priority !== other.priority) {
    return subject.priority > other.priority ? OVERLAP_WINNER.SUBJECT : OVERLAP_WINNER.OTHER;
  }

  return subject.id !== null && other.id !== null && subject.id < other.id
    ? OVERLAP_WINNER.SUBJECT
    : OVERLAP_WINNER.OTHER;
}
