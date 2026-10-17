import type { OrderStatus } from '../../../common/enums/order-status.enum';
import type { VehicleType } from '../../../common/enums/vehicle-type.enum';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import type { OsrmProfile } from '../../../integrations/osrm/types/osrm.types';
import type { ROUTE_SEGMENT_KIND } from '../constants/routing.constants';

export type RouteSegmentKind = (typeof ROUTE_SEGMENT_KIND)[keyof typeof ROUTE_SEGMENT_KIND];

// One line of a map: an encoded polyline with 6 digits along the roads, or null when there is
// nothing to draw (no route, the routing service is down, the courier has no fresh position).
export type RouteSegment = {
  kind: RouteSegmentKind;
  geometry: string | null;
};

export type RouteLines = { segments: RouteSegment[] };

// A segment to build; a missing start is a courier without a fresh position.
export type SegmentPlan = {
  kind: RouteSegmentKind;
  from: GeoPoint | null;
  to: GeoPoint;
};

// The courier as the query returns them: the position columns are null until the first one.
export type RoutingCourierRow = {
  currentLat: number | null;
  currentLng: number | null;
  locationUpdatedAt: Date | null;
  vehicleType: VehicleType | null;
};

// Where the courier is now, if known, and the profile their vehicle goes by.
export type RoutingCourier = {
  position: GeoPoint | null;
  profile: OsrmProfile;
};

// The stage of an order and its two points.
export type RoutedOrder = {
  status: OrderStatus;
  pickup: GeoPoint;
  delivery: GeoPoint;
};
