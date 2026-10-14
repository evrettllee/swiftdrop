import { MS_PER_MINUTE } from '../../../common/constants/time.constants';

// Candidates
// A position older than this may be far from where the courier is now.
export const COURIER_LOCATION_FRESH_MS = 2 * MS_PER_MINUTE;
// Couriers farther than this in a straight line are not offered the order.
export const ASSIGNMENT_RADIUS_KM = 10;
// Only the nearest couriers in a straight line get a route request: the fastest of them wins.
export const ROUTED_CANDIDATES_LIMIT = 3;
// The length of one degree of latitude; a degree of longitude is shorter by the cosine of the latitude.
export const KM_PER_DEGREE = 111.32;
