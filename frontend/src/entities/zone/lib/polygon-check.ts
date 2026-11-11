import {
  POLYGON_ERROR_REASON,
  type PolygonErrorReason,
  type ZonePolygon,
} from '@/shared/staff-api';
import {
  orientation,
  onSegment,
  type ScaledPoint,
  scaledPoint,
  segmentsTouch,
  VERTEX_DECIMALS,
} from './planar';

const LIMITS = { MIN_VERTICES: 3, MAX_VERTICES: 200, MIN_AREA_KM2: 0.01 } as const;
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;
const KM_PER_DEGREE_LATITUDE = 110.574;
const KM_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111.32;
const SCALE = 10 ** VERTEX_DECIMALS;

type Vertex = [number, number];

function round(value: number): number {
  return Math.round(value * SCALE) / SCALE;
}

function sameVertex(first: Vertex, second: Vertex): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

export function ringVertices(ring: readonly (readonly number[])[]): Vertex[] {
  const vertices: Vertex[] = [];

  for (const [lng, lat] of ring) {
    const vertex: Vertex = [round(lng), round(lat)];
    const previous = vertices.at(-1);

    if (previous === undefined || !sameVertex(previous, vertex)) {
      vertices.push(vertex);
    }
  }

  while (vertices.length > 1 && sameVertex(vertices[0], vertices[vertices.length - 1])) {
    vertices.pop();
  }

  return vertices;
}

export function ringAreaKm2(vertices: readonly Vertex[]): number {
  const meanLat = vertices.reduce((sum, [, lat]) => sum + lat, 0) / vertices.length;
  const kmPerLng = KM_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos((meanLat * Math.PI) / 180);
  let twiceArea = 0;

  vertices.forEach(([lng, lat], index) => {
    const [nextLng, nextLat] = vertices[(index + 1) % vertices.length];
    twiceArea += lng * kmPerLng * nextLat * KM_PER_DEGREE_LATITUDE;
    twiceArea -= nextLng * kmPerLng * lat * KM_PER_DEGREE_LATITUDE;
  });

  return Math.abs(twiceArea) / 2;
}

function foldsBack(a: ScaledPoint, b: ScaledPoint, c: ScaledPoint): boolean {
  return orientation(a, b, c) === 0 && (onSegment(a, b, c) || onSegment(b, c, a));
}

export function hasSelfIntersection(vertices: readonly Vertex[]): boolean {
  const points = vertices.map(scaledPoint);
  const count = points.length;
  const at = (index: number) => points[index % count];

  for (let first = 0; first < count; first += 1) {
    if (foldsBack(at(first), at(first + 1), at(first + 2))) {
      return true;
    }

    for (let second = first + 2; second < count; second += 1) {
      const isAdjacent = first === 0 && second === count - 1;

      if (!isAdjacent && segmentsTouch(at(first), at(first + 1), at(second), at(second + 1))) {
        return true;
      }
    }
  }

  return false;
}

function isInRange([lng, lat]: readonly number[]): boolean {
  return Math.abs(lat) <= MAX_LATITUDE && Math.abs(lng) <= MAX_LONGITUDE;
}

export function checkZonePolygon(polygon: ZonePolygon): PolygonErrorReason | null {
  const ring = polygon[0] ?? [];

  if (!ring.every(isInRange)) {
    return POLYGON_ERROR_REASON.OUT_OF_RANGE;
  }

  const vertices = ringVertices(ring);

  if (vertices.length < LIMITS.MIN_VERTICES) {
    return POLYGON_ERROR_REASON.TOO_FEW_POINTS;
  }

  if (vertices.length > LIMITS.MAX_VERTICES) {
    return POLYGON_ERROR_REASON.TOO_MANY_POINTS;
  }

  if (hasSelfIntersection(vertices)) {
    return POLYGON_ERROR_REASON.SELF_INTERSECTION;
  }

  return ringAreaKm2(vertices) < LIMITS.MIN_AREA_KM2 ? POLYGON_ERROR_REASON.TOO_SMALL : null;
}
