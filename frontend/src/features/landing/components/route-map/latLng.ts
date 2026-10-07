import type { LatLngLiteral, LatLngTuple } from 'leaflet';
import type { GeoPoint } from '../../../../shared/types';

// Leaflet names the coordinates `lat` and `lng`, the API names them in full.
export function toLatLng(point: GeoPoint): LatLngTuple {
  return [point.latitude, point.longitude];
}

export function fromLatLng({ lat, lng }: LatLngLiteral): GeoPoint {
  return { latitude: lat, longitude: lng };
}
