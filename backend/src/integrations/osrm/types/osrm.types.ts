import type { z } from 'zod';
import type { OSRM_PROFILE } from '../constants/osrm.constants';
import type { osrmResponseSchema } from '../schemas/osrm-response.schema';

export type OsrmProfile = (typeof OSRM_PROFILE)[keyof typeof OSRM_PROFILE];

export type OsrmRoute = {
  distanceKm: number;
  durationSec: number;
};

// One route of the OSRM answer as it comes.
export type OsrmAnswerRoute = NonNullable<z.infer<typeof osrmResponseSchema>['routes']>[number];

// The line of a route along the roads: an encoded polyline with 6 digits after the point.
export type OsrmRouteGeometry = {
  geometry: string;
  distanceM: number;
  durationS: number;
};
