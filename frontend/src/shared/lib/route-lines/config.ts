import { MS_PER_SECOND } from '@/shared/config';

// A map without a line asks for it again this often, while the map is on the screen.
export const ROUTE_RETRY_MS = 10 * MS_PER_SECOND;
// A moving courier gets a new line at most this often...
export const ROUTE_REFRESH_INTERVAL_MS = 15 * MS_PER_SECOND;
// ...and only after moving this far from where the last line was asked for.
export const ROUTE_REFRESH_DISTANCE_M = 100;

export const METERS_PER_KM = 1000;
