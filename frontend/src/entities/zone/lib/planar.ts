export const VERTEX_DECIMALS = 6;

const SCALE = 10 ** VERTEX_DECIMALS;
const DOUBLE = 2n;

export type ScaledPoint = [bigint, bigint];

export function scaledPoint([lng, lat]: readonly number[]): ScaledPoint {
  return [BigInt(Math.round(lng * SCALE)) * DOUBLE, BigInt(Math.round(lat * SCALE)) * DOUBLE];
}

export function midpoint(a: ScaledPoint, b: ScaledPoint): ScaledPoint {
  return [(a[0] + b[0]) / DOUBLE, (a[1] + b[1]) / DOUBLE];
}

export function orientation(a: ScaledPoint, b: ScaledPoint, c: ScaledPoint): number {
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

  if (cross === 0n) {
    return 0;
  }

  return cross > 0n ? 1 : -1;
}

function between(value: bigint, first: bigint, second: bigint): boolean {
  return value >= (first < second ? first : second) && value <= (first > second ? first : second);
}

export function onSegment(a: ScaledPoint, b: ScaledPoint, point: ScaledPoint): boolean {
  return between(point[0], a[0], b[0]) && between(point[1], a[1], b[1]);
}

export function segmentsTouch(a: ScaledPoint, b: ScaledPoint, c: ScaledPoint, d: ScaledPoint) {
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

export function segmentsCross(a: ScaledPoint, b: ScaledPoint, c: ScaledPoint, d: ScaledPoint) {
  const abc = orientation(a, b, c);
  const abd = orientation(a, b, d);
  const cda = orientation(c, d, a);
  const cdb = orientation(c, d, b);

  return abc * abd < 0 && cda * cdb < 0;
}
