import type { GeoPoint } from '@/shared/lib/geo';
import { CURRENT_POSITION_OPTIONS, GEO_PROBLEM, type GeoProblem } from '../config/geolocation';

export function toGeoPoint(position: GeolocationPosition): GeoPoint {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

// The position of the device, or the reason there is none: a denial or anything else.
export function getCurrentPoint(): Promise<GeoPoint | GeoProblem> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(GEO_PROBLEM.FAILED);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toGeoPoint(position)),
      (error) =>
        resolve(error.code === error.PERMISSION_DENIED ? GEO_PROBLEM.DENIED : GEO_PROBLEM.FAILED),
      CURRENT_POSITION_OPTIONS,
    );
  });
}
