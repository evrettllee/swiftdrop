import type { OrderSupportTicket } from '@/common/database/order-support-ticket';
import type { ListPage } from '@/common/types/page.types';
import type { OrderTransitionChanges } from '@/common/database/order-status-transition';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import type { PackageSpec } from '@/common/schemas/package-spec.schema';
import type { CourierVehicle } from '@/modules/couriers/types/couriers.types';
import type { RouteLines } from '@/modules/routing/types/routing.types';
import type { HANDOVER_OUTCOME } from '../constants/deliveries.constants';

// The courier making a request: the user writes the history, the profile owns the order.
export type CourierIdentity = {
  userId: number;
  courierProfileId: number;
};

type OrderAddress = GeoPoint & {
  city: string;
  street: string;
  house: string;
  apartment: string | null;
};

type Contact = { name: string; phone: string | null };

// An order as the database query returns it: the sender is the client who placed it.
export type CourierOrderRow = {
  orderId: number;
  status: OrderStatus;
  pickup: OrderAddress;
  delivery: OrderAddress;
  sender: { firstName: string; lastName: string; phone: string | null };
  recipient: { name: string; phone: string };
  parcel: PackageSpec;
  distanceKm: number;
};

// A finished order of the courier: the places, the parcel and the stages, without the people of the
// order (no names and no phones).
export type CourierHistoryOrder = {
  orderId: number;
  status: OrderStatus;
  finishedAt: string | null;
  pickup: OrderAddress;
  delivery: OrderAddress;
  parcel: PackageSpec;
  distanceKm: number;
  history: { status: OrderStatus; changedAt: Date }[];
};

// An order as the courier sees it after accepting.
export type CourierOrder = Omit<CourierOrderRow, 'sender'> & { sender: Contact };

export type CurrentCourierOrderView = CourierOrder & { supportTicket: OrderSupportTicket | null };

export type CurrentCourierOrder = { order: CurrentCourierOrderView | null };

// One step of the courier through the order.
export type DeliveryStep = {
  from: OrderStatus;
  to: OrderStatus;
  changes?: OrderTransitionChanges;
};

export type HandoverOutcome =
  | { kind: typeof HANDOVER_OUTCOME.DELIVERED }
  | { kind: typeof HANDOVER_OUTCOME.NOT_FOUND }
  | { kind: typeof HANDOVER_OUTCOME.WRONG_STEP }
  | { kind: typeof HANDOVER_OUTCOME.LOCKED; lockedUntil: Date }
  | { kind: typeof HANDOVER_OUTCOME.WRONG_CODE; attemptsLeft: number };

// An order with its courier as the query returns it: the courier columns are null when there is none.
// The phone is read only while the client may get it, otherwise it is null.
export type ClientOrderCourierRow = {
  status: OrderStatus;
  otpCode: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  brand: string | null;
  model: string | null;
  licensePlate: string | null;
};

// What the client sees about the courier of an order. The phone key is absent, not null, when the
// client may not call the courier or the courier has no phone.
export type ClientOrderCourier = {
  courier: { name: string; vehicle: CourierVehicle | null; phone?: string } | null;
  deliveryCode: string | null;
};

// The position of the courier as the query returns it; the age is counted by the database clock.
export type ClientCourierPositionRow = {
  status: OrderStatus;
  currentLat: number | null;
  currentLng: number | null;
  locationUpdatedAt: Date | null;
  positionAgeMs: number | null;
};

// The last known position of the courier for the client; isStale means lost connection.
export type ClientCourierPosition = GeoPoint & { updatedAt: string; isStale: boolean };

// The route of an order for the client: the lines, where the courier is and, while they go to the
// pickup point, when they reach it (ISO, as pickupEtaAt of order:eta).
export type ClientOrderRoute = RouteLines & {
  courierPosition: ClientCourierPosition | null;
  pickupEtaAt: string | null;
};

type ShortAddress = { street: string; house: string };

// A finished order as the query returns it; the finish time is null when its history is missing.
export type CourierHistoryRow = {
  orderId: number;
  status: OrderStatus;
  finishedAt: Date | null;
  pickup: ShortAddress;
  delivery: ShortAddress;
  distanceKm: number;
  weightKg: number;
};

export type CourierHistoryItem = Omit<CourierHistoryRow, 'finishedAt'> & {
  finishedAt: string | null;
};

export type CourierHistoryPage = ListPage<CourierHistoryItem>;

export type CourierTodayStats = {
  delivered: number;
  distanceKm: number;
  offersReceived: number;
  offersAccepted: number;
  // Reviews come with their own part of the app; until then there is no rating.
  rating: number | null;
};
