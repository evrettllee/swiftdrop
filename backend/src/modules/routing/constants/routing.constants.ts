import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { buildThrottleOverride } from '@/common/utils/throttle';
import { OSRM_PROFILE } from '@/integrations/osrm/constants/osrm.constants';

// Routes
// The route of an offer or of an order lives under it, for example /orders/:orderId/route.
export const ROUTE_PATH_SEGMENT = 'route';

// The route of the calculator and of the order form, before an order exists.
export const ROUTE_PREVIEW_ROUTES = {
  BASE: 'routing',
  PREVIEW: 'preview',
} as const;

// Segments
// The parts of a route drawn on a map, each its own line.
export const ROUTE_SEGMENT_KIND = {
  // From the courier to the pickup point.
  TO_PICKUP: 'toPickup',
  // From the courier to the recipient, once the parcel is picked up.
  TO_DROPOFF: 'toDropoff',
  // The trip of the parcel itself.
  PICKUP_TO_DROPOFF: 'pickupToDropoff',
} as const;

// Before an order has a courier there is no vehicle to route for: the car goes by the streets the
// price is counted along.
export const DEFAULT_ROUTING_PROFILE = OSRM_PROFILE.CAR;

// Throttling
// Stricter than the global limit, as the estimates: a request may call the external routing service.
export const ROUTING_THROTTLE_LIMIT = 30;
export const ROUTING_THROTTLE_TTL_MS = MS_PER_MINUTE;

// The preview is public: a guest, counted by address, gets fewer requests than a signed-in user.
export const ROUTE_PREVIEW_GUEST_THROTTLE_LIMIT = 10;
export const ROUTE_PREVIEW_THROTTLE_KEY = 'route-preview';

export const ROUTING_THROTTLE = buildThrottleOverride(
  ROUTING_THROTTLE_LIMIT,
  ROUTING_THROTTLE_TTL_MS,
);
