import { MS_PER_MINUTE, MS_PER_SECOND } from '@/common/constants/time.constants';

// Events of the order room, for the client who owns the order and its courier.
export const ORDER_ROOM_EVENTS = {
  // The order got a new status; sent after the change is committed.
  ORDER_STATUS: 'order:status',
  // A new arrival estimate and the line of the courier to their next point.
  ORDER_ETA: 'order:eta',
} as const;

// Arrival estimate
// One estimate per order at most this often: the routing service is shared and external. A new
// status is estimated at once, as the next point of the courier changes with it.
export const ETA_RECALC_INTERVAL_MS = 30 * MS_PER_SECOND;
// A shutdown waits this long for the running estimates before the database is closed.
export const ETA_SHUTDOWN_WAIT_MS = 5 * MS_PER_SECOND;
// Taking the parcel from the sender, and handing it to the recipient.
export const PICKUP_HANDOVER_MS = 3 * MS_PER_MINUTE;
export const DROPOFF_HANDOVER_MS = 2 * MS_PER_MINUTE;

// Where the line of the courier leads.
export const COURIER_LEG_TARGET = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
} as const;
