import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import { POLYLINE_PRECISION } from '../constants/osrm.constants';

// A point of a polyline in whole millionths of a degree, as the encoding keeps it.
type ScaledPoint = { lat: number; lng: number };

const CHAR_OFFSET = 63;
const CHUNK_BITS = 5;
const CHUNK_MASK = 0x1f;
const CONTINUE_BIT = 0x20;

function readValue(text: string, start: number): { value: number; next: number } {
  let result = 0;
  let shift = 0;
  let index = start;
  let chunk: number;

  do {
    chunk = text.charCodeAt(index) - CHAR_OFFSET;
    index += 1;
    result |= (chunk & CHUNK_MASK) << shift;
    shift += CHUNK_BITS;
  } while (chunk >= CONTINUE_BIT);

  return { value: result & 1 ? ~(result >> 1) : result >> 1, next: index };
}

function writeValue(value: number): string {
  let rest = value < 0 ? ~(value << 1) : value << 1;
  let text = '';

  while (rest >= CONTINUE_BIT) {
    text += String.fromCharCode((CONTINUE_BIT | (rest & CHUNK_MASK)) + CHAR_OFFSET);
    rest >>= CHUNK_BITS;
  }

  return text + String.fromCharCode(rest + CHAR_OFFSET);
}

export function decodePolyline(text: string): ScaledPoint[] {
  const points: ScaledPoint[] = [];
  let lat = 0;
  let lng = 0;
  let index = 0;

  while (index < text.length) {
    const latDelta = readValue(text, index);
    const lngDelta = readValue(text, latDelta.next);
    lat += latDelta.value;
    lng += lngDelta.value;
    index = lngDelta.next;
    points.push({ lat, lng });
  }

  return points;
}

export function encodePolyline(points: readonly ScaledPoint[]): string {
  let previous: ScaledPoint = { lat: 0, lng: 0 };

  return points
    .map((point) => {
      const text = writeValue(point.lat - previous.lat) + writeValue(point.lng - previous.lng);
      previous = point;
      return text;
    })
    .join('');
}

// The line from its start up to the point closest to the given one, that point included. OSRM draws
// a route through every snapped waypoint, so cutting at a waypoint gives the first leg.
export function polylineUntil(text: string, point: GeoPoint): string {
  const points = decodePolyline(text);
  const target = {
    lat: Math.round(point.latitude * POLYLINE_PRECISION),
    lng: Math.round(point.longitude * POLYLINE_PRECISION),
  };
  let closest = 0;
  let closestDistance = Infinity;

  points.forEach(({ lat, lng }, index) => {
    const distance = (lat - target.lat) ** 2 + (lng - target.lng) ** 2;

    if (distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });

  return encodePolyline(points.slice(0, closest + 1));
}
