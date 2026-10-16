import type { LatLngTuple } from 'leaflet';
import type { RouteLine } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';

// Every point of the lines: a road may go well outside the box of the route points.
export function linePoints(lines: RouteLine[]): LatLngTuple[] {
  return lines.flatMap(({ points }) => points.map(toLatLng));
}

// The lines a map has, by kind: the map is fitted again when a line appears or goes, not when it
// only moves with the courier.
export function linesShapeKey(lines: RouteLine[]): string {
  return lines.map(({ kind }) => kind).join();
}
