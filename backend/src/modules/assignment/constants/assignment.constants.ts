import { MS_PER_MINUTE, MS_PER_SECOND } from '../../../common/constants/time.constants';
import type { VehicleType } from '../../../common/enums/vehicle-type.enum';
import { OSRM_PROFILE } from '../../../integrations/osrm/constants/osrm.constants';
import type { OsrmProfile } from '../../../integrations/osrm/types/osrm.types';

// Routes
export const COURIER_OFFERS_ROUTES = {
  BASE: 'couriers/me/offers',
  CURRENT: 'current',
} as const;

// Candidates
// A position older than this may be far from where the courier is now.
export const COURIER_LOCATION_FRESH_MS = 2 * MS_PER_MINUTE;
// Couriers farther than this in a straight line are not offered the order.
export const ASSIGNMENT_RADIUS_KM = 10;
// Only the nearest couriers in a straight line get a route request: the fastest of them wins.
export const ROUTED_CANDIDATES_LIMIT = 3;
// The length of one degree of latitude; a degree of longitude is shorter by the cosine of the latitude.
export const KM_PER_DEGREE = 111.32;

// Routing
// The routing service knows three profiles, the app has five vehicles. A scooter here is a motor
// scooter that rides with the traffic, so it takes the car profile like the truck.
export const VEHICLE_ROUTING_PROFILE: Record<VehicleType, OsrmProfile> = {
  foot: OSRM_PROFILE.FOOT,
  bicycle: OSRM_PROFILE.BIKE,
  scooter: OSRM_PROFILE.CAR,
  car: OSRM_PROFILE.CAR,
  truck: OSRM_PROFILE.CAR,
};

// Offers
// The courier has this long to accept or decline, as the timer in the cabinet shows.
export const OFFER_TTL_MS = 30 * MS_PER_SECOND;
// Before accepting, the courier sees the delivery point only to about a kilometre: two digits
// after the point of a degree.
export const DELIVERY_AREA_COORDINATE_DIGITS = 2;
