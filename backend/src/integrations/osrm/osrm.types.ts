import type { OSRM_PROFILE } from './osrm.constants';

export type OsrmProfile = (typeof OSRM_PROFILE)[keyof typeof OSRM_PROFILE];

export type OsrmRoute = {
  distanceKm: number;
  durationSec: number;
};
