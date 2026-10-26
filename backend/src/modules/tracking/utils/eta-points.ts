import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import {
  COURIER_LEG_TARGET,
  DROPOFF_HANDOVER_MS,
  PICKUP_HANDOVER_MS,
} from '../constants/tracking.constants';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import type { EtaPlan } from '../types/tracking.types';

// When the courier reaches the pickup point: the first leg of the trip leads there before the
// pickup, without the handover. Null after the pickup, when the first leg leads to the recipient.
export function pickupArrival(
  plan: EtaPlan,
  firstLegDurationS: number,
  nowMs: number,
): Date | null {
  return plan.toPoint === COURIER_LEG_TARGET.PICKUP
    ? new Date(nowMs + firstLegDurationS * MS_PER_SECOND)
    : null;
}

// The rest of the trip by the status: before the pickup the courier goes to the sender and on to
// the recipient, after it straight to the recipient. Null when the order is not with the courier.
export function etaPlan(
  status: OrderStatus,
  courier: GeoPoint,
  pickup: GeoPoint,
  delivery: GeoPoint,
): EtaPlan | null {
  let plan: EtaPlan | null = null;

  if (status === ORDER_STATUS.COURIER_ASSIGNED) {
    plan = {
      points: [courier, pickup, delivery],
      handoverMs: PICKUP_HANDOVER_MS + DROPOFF_HANDOVER_MS,
      toPoint: COURIER_LEG_TARGET.PICKUP,
    };
  } else if (status === ORDER_STATUS.PICKED_UP || status === ORDER_STATUS.IN_TRANSIT) {
    plan = {
      points: [courier, delivery],
      handoverMs: DROPOFF_HANDOVER_MS,
      toPoint: COURIER_LEG_TARGET.DROPOFF,
    };
  }

  return plan;
}
