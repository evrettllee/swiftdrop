import { ORDER_STATUS, type OrderDetails, type OrderStatus, PAYMENT_STATUS } from '@/shared/api';
import { getStatusLine, type StatusLine, type StatusLineSource } from './status-line';

export const CREATED_MS = Date.parse('2026-10-24T12:00:00Z');
export const NOW_MS = CREATED_MS + 20 * 60_000;
export const MINUTE = 60_000;
const POINT = {
  city: 'Минск',
  street: 'Ленина',
  house: '1',
  apartment: null,
  latitude: 53.9,
  longitude: 27.5,
};

export function at(offsetMs: number): Date {
  return new Date(CREATED_MS + offsetMs);
}

export function order(
  status: OrderStatus,
  changes: Partial<OrderDetails> = {},
  historyAt: Partial<Record<OrderStatus, number>> = {},
): OrderDetails {
  return {
    orderId: 7,
    status,
    price: 9.23,
    currency: 'BYN',
    priceCoefficient: 1,
    distanceKm: 7.98,
    estimatedMinutes: 24,
    estimatedDeliveryAt: at(58 * MINUTE),
    createdAt: at(0),
    recipient: { name: 'Ирина Козлова', phone: '+375291234567' },
    parcel: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true },
    pickup: POINT,
    delivery: POINT,
    history: Object.entries({ [ORDER_STATUS.PENDING]: 0, ...historyAt }).map(([entry, offset]) => ({
      status: entry as OrderStatus,
      changedAt: at(offset),
    })),
    cancelledBy: null,
    payment: null,
    supportTicket: null,
    ...changes,
  };
}

const NO_TRACKING: StatusLineSource['tracking'] = {
  estimatedDeliveryAt: null,
  pickupEtaAt: null,
  isPositionStale: false,
  positionReceivedAt: null,
};

export function line(
  details: OrderDetails,
  tracking: Partial<StatusLineSource['tracking']> = {},
  payment = { isChecking: false, isFailed: false },
): StatusLine {
  return getStatusLine({
    order: details,
    payment,
    tracking: { ...NO_TRACKING, ...tracking },
    nowMs: NOW_MS,
  });
}

export const paid = { payment: { status: PAYMENT_STATUS.PAID, amountUsd: 3.2 } };
export const refunded = { payment: { status: PAYMENT_STATUS.REFUNDED, amountUsd: 3.2 } };
