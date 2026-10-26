import { ORDER_BUSY_MESSAGE } from '@/common/constants/orders.constants';
import { MS_PER_MINUTE, MS_PER_SECOND } from '@/common/constants/time.constants';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import { OSRM_PROFILE } from '@/integrations/osrm/constants/osrm.constants';
import type { OsrmProfile } from '@/integrations/osrm/types/osrm.types';
import { ROUTE_PATH_SEGMENT } from '@/modules/routing/constants/routing.constants';

// Routes
export const OFFER_ID_ROUTE_PARAM = ':offerId';

export const COURIER_OFFERS_ROUTES = {
  BASE: 'couriers/me/offers',
  CURRENT: 'current',
  CURRENT_ROUTE: `current/${ROUTE_PATH_SEGMENT}`,
  ACCEPT: `${OFFER_ID_ROUTE_PARAM}/accept`,
  DECLINE: `${OFFER_ID_ROUTE_PARAM}/decline`,
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

// Dispatch
// How often the dispatcher looks for orders without a courier and for offers whose time is up.
export const ASSIGNMENT_INTERVAL_MS = 5 * MS_PER_SECOND;
// Orders handled in one round; the rest wait for the next one.
export const ASSIGNMENT_BATCH_SIZE = 20;
// Orders of a round dispatched at once: each waits mostly for the routing service, and every one
// in flight may hold a pool connection for a moment.
export const ASSIGNMENT_ROUND_CONCURRENCY = 5;
// After this many offers nobody accepted, a manager assigns the order by hand.
export const MAX_OFFERS_PER_ORDER = 5;
// An order with no courier near for this long after the payment goes to a manager too.
export const CANDIDATE_SEARCH_TIMEOUT_MS = 5 * MS_PER_MINUTE;

// Validation
export const ASSIGNMENT_VALIDATION_MESSAGES = {
  OFFER_ID_INVALID: 'Некорректный номер предложения',
} as const;

// Errors
export const ASSIGNMENT_ERROR_MESSAGES = {
  OFFER_NOT_FOUND: 'Предложение не найдено',
  OFFER_CLOSED: 'Предложение уже закрыто: время вышло или заказ отменён',
  ORDER_UNAVAILABLE: 'Заказ уже недоступен',
  ON_ORDER: 'Сначала завершите текущий заказ',
  // The order row is held by another operation (a cancellation, a payment being settled).
  BUSY: ORDER_BUSY_MESSAGE,
} as const;
