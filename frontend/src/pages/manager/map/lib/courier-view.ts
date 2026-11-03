import { formatOrderNumber, getOrderStatusMeta, STATUS_AUDIENCE } from '@/entities/order';
import { MS_PER_MINUTE, MS_PER_SECOND } from '@/shared/config';
import { COURIER_MAP_STATE, type CourierMapState } from '@/shared/staff-api';
import { PIN_TONE, type PinTone } from '@/shared/ui/route-map';
import { CARD_TEXTS, DURATION_TEXTS, STATE_TEXTS } from '../config/texts';
import type { LiveCourier } from './courier-state';

const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;

const STATE_LABELS: Record<CourierMapState, string> = {
  [COURIER_MAP_STATE.FREE]: STATE_TEXTS.FREE,
  [COURIER_MAP_STATE.ON_ORDER]: STATE_TEXTS.ON_ORDER,
  [COURIER_MAP_STATE.OFFER]: STATE_TEXTS.OFFER,
  [COURIER_MAP_STATE.NO_SIGNAL]: STATE_TEXTS.NO_SIGNAL,
};

const PIN_TONES: Record<CourierMapState, PinTone> = {
  [COURIER_MAP_STATE.FREE]: PIN_TONE.FILLED,
  [COURIER_MAP_STATE.OFFER]: PIN_TONE.FILLED,
  [COURIER_MAP_STATE.ON_ORDER]: PIN_TONE.RING,
  [COURIER_MAP_STATE.NO_SIGNAL]: PIN_TONE.MUTED,
};

export function durationText(ms: number): string {
  const seconds = Math.max(Math.floor(ms / MS_PER_SECOND), 0);
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);

  if (minutes === 0) {
    return DURATION_TEXTS.seconds(seconds);
  }

  return minutes < MINUTES_PER_HOUR
    ? DURATION_TEXTS.minutes(minutes)
    : DURATION_TEXTS.hours(Math.floor(minutes / MINUTES_PER_HOUR));
}

export function stateLabel(state: CourierMapState): string {
  return STATE_LABELS[state];
}

export function stateText(courier: LiveCourier, now: number): string {
  if (courier.state === COURIER_MAP_STATE.NO_SIGNAL && courier.seenAt !== null) {
    return STATE_TEXTS.noSignalFor(durationText(now - courier.seenAt));
  }

  return STATE_LABELS[courier.state];
}

export function pinTone(state: CourierMapState): PinTone {
  return PIN_TONES[state];
}

export function positionAgo(courier: LiveCourier, now: number): string | null {
  return courier.seenAt === null ? null : CARD_TEXTS.ago(durationText(now - courier.seenAt));
}

export type CourierOrderLink = { orderId: number; text: string };

export function orderLinkOf(courier: LiveCourier): CourierOrderLink | null {
  if (courier.activeOrder !== null) {
    const { orderId, status } = courier.activeOrder;
    const label = getOrderStatusMeta(status, STATUS_AUDIENCE.STAFF).label.toLowerCase();

    return { orderId, text: CARD_TEXTS.activeOrder(formatOrderNumber(orderId), label) };
  }

  if (courier.openOfferOrderId !== null) {
    const orderId = courier.openOfferOrderId;

    return { orderId, text: CARD_TEXTS.offerOrder(formatOrderNumber(orderId)) };
  }

  return null;
}

export function etaMinutes(estimatedDeliveryAt: Date, now: number): number {
  return Math.max(Math.ceil((estimatedDeliveryAt.getTime() - now) / MS_PER_MINUTE), 1);
}
