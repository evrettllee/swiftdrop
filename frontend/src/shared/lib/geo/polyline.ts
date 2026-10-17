import type { GeoPoint } from './geo-point';

// The routing service encodes a line as a polyline with 6 digits after the point (polyline6):
// each coordinate is the difference to the previous one, written in 5-bit chunks shifted into
// printable characters.
const POLYLINE6_FACTOR = 1e6;
const CHAR_OFFSET = 63;
const CHUNK_BITS = 5;
const CHUNK_MASK = 0x1f;
const CONTINUATION_BIT = 0x20;

type Reading = { value: number; next: number };

// One signed number from `start`; null when the text ends in the middle of it or holds a
// character the encoding never makes.
function readValue(encoded: string, start: number): Reading | null {
  let result = 0;
  let shift = 0;
  let index = start;

  while (index < encoded.length) {
    const chunk = encoded.charCodeAt(index) - CHAR_OFFSET;
    index += 1;

    if (chunk < 0 || chunk > CONTINUATION_BIT + CHUNK_MASK) {
      return null;
    }

    // Multiplication instead of `<<`: a long route overflows the 32 bits of bitwise operators.
    result += (chunk & CHUNK_MASK) * 2 ** shift;
    shift += CHUNK_BITS;

    if ((chunk & CONTINUATION_BIT) === 0) {
      // The lowest bit is the sign; the rest is the magnitude.
      const magnitude = Math.floor(result / 2);

      return { value: result % 2 === 1 ? -magnitude - 1 : magnitude, next: index };
    }
  }

  return null;
}

// The points of a polyline6 line, latitude first as the format writes them. A broken line gives
// no points at all, so a map never draws half of a wrong one.
export function decodePolyline6(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];
  let latitude = 0;
  let longitude = 0;
  let index = 0;

  while (index < encoded.length) {
    const latitudeDelta = readValue(encoded, index);
    const longitudeDelta = latitudeDelta === null ? null : readValue(encoded, latitudeDelta.next);

    if (latitudeDelta === null || longitudeDelta === null) {
      return [];
    }

    latitude += latitudeDelta.value;
    longitude += longitudeDelta.value;
    index = longitudeDelta.next;
    points.push({ latitude: latitude / POLYLINE6_FACTOR, longitude: longitude / POLYLINE6_FACTOR });
  }

  return points;
}
