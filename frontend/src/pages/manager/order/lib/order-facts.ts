import { VEHICLE_TYPE_META } from '@/entities/courier';
import type { CourierVehicle } from '@/shared/api';
import { formatTime } from '@/shared/lib/format';
import {
  type ManagerOrderActions,
  type ManagerOrderCourier,
  type ManagerOrderOffer,
  type ManagerOrderTicket,
  SUPPORT_TICKET_STATUS,
} from '@/shared/staff-api';
import { ACTOR_LABELS, OFFERS_TEXTS, TICKET_TEXTS, TICKET_TOPIC_LABELS } from '../config/texts';
import { minutesSince, secondsToMinutes } from './minutes';

export function hasActions(actions: ManagerOrderActions): boolean {
  return Object.values(actions).some(Boolean);
}

export function toCourierVehicle(
  vehicle: NonNullable<ManagerOrderCourier['vehicle']>,
): CourierVehicle {
  return {
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    licensePlate: vehicle.plate,
  };
}

export function offerVehicleLabel(offer: ManagerOrderOffer): string | null {
  return offer.courier.vehicleType === null
    ? null
    : VEHICLE_TYPE_META[offer.courier.vehicleType].label;
}

export function offerPickupText(offer: ManagerOrderOffer): string {
  return OFFERS_TEXTS.minutes(secondsToMinutes(offer.pickupEtaSec));
}

export function ticketTitle(ticket: ManagerOrderTicket): string {
  return ticket.subject ?? TICKET_TOPIC_LABELS[ticket.topic];
}

export function ticketCaption(ticket: ManagerOrderTicket, nowMs: number, hasTime: boolean): string {
  let state: string | null = null;

  if (ticket.status === SUPPORT_TICKET_STATUS.CLOSED) {
    state = TICKET_TEXTS.CLOSED;
  } else if (ticket.awaitingStaff) {
    state = TICKET_TEXTS.waiting(minutesSince(ticket.lastMessageAt, nowMs));
  }

  return [ACTOR_LABELS[ticket.author], hasTime ? formatTime(ticket.lastMessageAt) : null, state]
    .filter((part) => part !== null)
    .join(TICKET_TEXTS.SEPARATOR);
}
