import type { OrderTransitionChanges } from '../../../common/database/order-status-transition';
import type { OrderStatus } from '../../../common/enums/order-status.enum';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import type { PackageSpec } from '../../../common/schemas/package-spec.schema';
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
};

// An order as the courier sees it after accepting.
export type CourierOrder = Omit<CourierOrderRow, 'sender'> & { sender: Contact };

export type CurrentCourierOrder = { order: CourierOrder | null };

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
