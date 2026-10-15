import type { GeoPoint } from '@/shared/lib/geo';
import {
  FALLBACK_POSITION_OPTIONS,
  FIRST_POSITION_OPTIONS,
  GEO_PROBLEM,
  type GeoProblem,
} from '../config/geolocation';

export function toGeoPoint(position: GeolocationPosition): GeoPoint {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

// A denial is the courier's answer: asking again does not change it.
export function toGeoProblem(error: GeolocationPositionError): GeoProblem {
  return error.code === error.PERMISSION_DENIED ? GEO_PROBLEM.DENIED : GEO_PROBLEM.FAILED;
}

function requestPosition(
  options: PositionOptions,
): Promise<GeolocationPosition | GeolocationPositionError> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(resolve, resolve, options);
  });
}

// The position of the device, or the reason there is none. A timeout or no position of the precise
// try is followed by a rough one; a denial is final.
export async function getCurrentPoint(): Promise<GeoPoint | GeoProblem> {
  if (!('geolocation' in navigator)) {
    return GEO_PROBLEM.FAILED;
  }

  let result = await requestPosition(FIRST_POSITION_OPTIONS);

  if (!('coords' in result) && toGeoProblem(result) === GEO_PROBLEM.FAILED) {
    result = await requestPosition(FALLBACK_POSITION_OPTIONS);
  }

  return 'coords' in result ? toGeoPoint(result) : toGeoProblem(result);
}
