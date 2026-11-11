import {
  KM_PER_DEGREE_LATITUDE,
  KM_PER_DEGREE_LONGITUDE_AT_EQUATOR,
  ZONE_POLYGON_ERROR,
  ZONE_POLYGON_LIMITS,
} from '../constants/zones.constants';
import type { ZonePolygonCheck } from '../types/zones.types';

type Vertex = [number, number];
type ScaledVertex = [bigint, bigint];

const SCALE = 10 ** ZONE_POLYGON_LIMITS.DECIMALS;

function round(value: number): number {
  return Math.round(value * SCALE) / SCALE;
}

function isInRange([lng, lat]: readonly number[]): boolean {
  return (
    Math.abs(lat) <= ZONE_POLYGON_LIMITS.MAX_LATITUDE &&
    Math.abs(lng) <= ZONE_POLYGON_LIMITS.MAX_LONGITUDE
  );
}

function sameVertex(first: Vertex, second: Vertex): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

export function ringVertices(ring: readonly (readonly number[])[]): Vertex[] {
  const vertices: Vertex[] = [];

  for (const [lng, lat] of ring) {
    const vertex: Vertex = [round(lng), round(lat)];
    const previous = vertices.at(-1);

    if (!previous || !sameVertex(previous, vertex)) {
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

function scaled([lng, lat]: Vertex): ScaledVertex {
  return [BigInt(Math.round(lng * SCALE)), BigInt(Math.round(lat * SCALE))];
}

function orientation(a: ScaledVertex, b: ScaledVertex, c: ScaledVertex): number {
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

  return cross === 0n ? 0 : cross > 0n ? 1 : -1;
}

function between(value: bigint, first: bigint, second: bigint): boolean {
  return value >= (first < second ? first : second) && value <= (first > second ? first : second);
}

function onSegment(a: ScaledVertex, b: ScaledVertex, point: ScaledVertex): boolean {
  return between(point[0], a[0], b[0]) && between(point[1], a[1], b[1]);
}

function segmentsTouch(
  a: ScaledVertex,
  b: ScaledVertex,
  c: ScaledVertex,
  d: ScaledVertex,
): boolean {
  const abc = orientation(a, b, c);
  const abd = orientation(a, b, d);
  const cda = orientation(c, d, a);
  const cdb = orientation(c, d, b);

  return (
    (abc !== abd && cda !== cdb) ||
    (abc === 0 && onSegment(a, b, c)) ||
    (abd === 0 && onSegment(a, b, d)) ||
    (cda === 0 && onSegment(c, d, a)) ||
    (cdb === 0 && onSegment(c, d, b))
  );
}

function foldsBack(a: ScaledVertex, b: ScaledVertex, c: ScaledVertex): boolean {
  return orientation(a, b, c) === 0 && (onSegment(a, b, c) || onSegment(b, c, a));
}

export function hasSelfIntersection(vertices: readonly Vertex[]): boolean {
  const points = vertices.map(scaled);
  const count = points.length;
  const at = (index: number) => points[index % count];

  for (let first = 0; first < count; first += 1) {
    if (foldsBack(at(first), at(first + 1), at(first + 2))) {
      return true;
    }

    for (let second = first + 2; second < count; second += 1) {
      const adjacent = first === 0 && second === count - 1;

      if (!adjacent && segmentsTouch(at(first), at(first + 1), at(second), at(second + 1))) {
        return true;
      }
    }
  }

  return false;
}

export function checkZonePolygon(
  polygon: readonly (readonly (readonly number[])[])[],
): ZonePolygonCheck {
  const [ring] = polygon;

  if (!ring.every(isInRange)) {
    return { ok: false, reason: ZONE_POLYGON_ERROR.OUT_OF_RANGE };
  }

  const vertices = ringVertices(ring);

  if (vertices.length < ZONE_POLYGON_LIMITS.MIN_VERTICES) {
    return { ok: false, reason: ZONE_POLYGON_ERROR.TOO_FEW_POINTS };
  }

  if (vertices.length > ZONE_POLYGON_LIMITS.MAX_VERTICES) {
    return { ok: false, reason: ZONE_POLYGON_ERROR.TOO_MANY_POINTS };
  }

  if (hasSelfIntersection(vertices)) {
    return { ok: false, reason: ZONE_POLYGON_ERROR.SELF_INTERSECTION };
  }

  const areaKm2 = ringAreaKm2(vertices);

  if (areaKm2 < ZONE_POLYGON_LIMITS.MIN_AREA_KM2) {
    return { ok: false, reason: ZONE_POLYGON_ERROR.TOO_SMALL };
  }

  return { ok: true, polygon: [[...vertices, vertices[0]]], vertexCount: vertices.length, areaKm2 };
}
