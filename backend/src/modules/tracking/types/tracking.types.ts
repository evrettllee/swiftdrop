import type { OrderStatus } from '../../../common/enums/order-status.enum';
import type { VehicleType } from '../../../common/enums/vehicle-type.enum';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import type { COURIER_LEG_TARGET } from '../constants/tracking.constants';

// The payload of order:status; estimatedDeliveryAt is an ISO time or null, as in GET /orders/:id.
export type OrderStatusEvent = {
  orderId: number;
  status: OrderStatus;
  estimatedDeliveryAt: string | null;
};

export type CourierLegTarget = (typeof COURIER_LEG_TARGET)[keyof typeof COURIER_LEG_TARGET];

// The line along the roads from the courier to the point they go to now (polyline6).
export type CourierLeg = { geometry: string; toPoint: CourierLegTarget };

// The payload of order:eta.
export type OrderEtaEvent = {
  orderId: number;
  estimatedDeliveryAt: string;
  courierLeg: CourierLeg | null;
};

// What is kept in memory for an order with a courier.
export type OrderEtaEntry = {
  // When the routing service was last asked for this order, 0 before the first time.
  computedAtMs: number;
  inFlight: boolean;
  // A new status came while an estimate was running: one more runs right after it.
  forceQueued: boolean;
  courierLeg: (CourierLeg & { basedOnUpdatedAt: Date }) | null;
};

// The points of the trip left for the courier and the time of the handovers on the way.
export type EtaPlan = {
  points: GeoPoint[];
  handoverMs: number;
  toPoint: CourierLegTarget;
};

// What an estimate needs from the database; the age of the position is by the database clock.
export type EtaSource = {
  status: OrderStatus;
  pickup: GeoPoint;
  delivery: GeoPoint;
  vehicleType: VehicleType | null;
  position: GeoPoint | null;
  locationUpdatedAt: Date | null;
  positionAgeMs: number | null;
};
