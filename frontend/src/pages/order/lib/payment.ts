import { splitPrice } from '@/entities/price';
import { ORDER_STATUS, type OrderDetails, PAYMENT_STATUS } from '@/shared/api';
import { MS_PER_MINUTE } from '@/shared/config';
import { PAYMENT_VIEW } from '../config/payment';
import type { PaymentView } from '../model/payment-view';

export function getPaymentView(order: OrderDetails): PaymentView {
  let view: PaymentView = PAYMENT_VIEW.UNPAID;

  if (order.payment?.status === PAYMENT_STATUS.PAID) {
    view = PAYMENT_VIEW.PAID;
  } else if (order.payment?.status === PAYMENT_STATUS.REFUNDED) {
    view = PAYMENT_VIEW.REFUNDED;
  }

  return view;
}

// The webhook of the payment confirms the order, so this is the time of the payment.
export function getPaidAt(order: OrderDetails): Date | null {
  return order.history.find((entry) => entry.status === ORDER_STATUS.CONFIRMED)?.changedAt ?? null;
}

// The time the order reached its current status: for a cancelled order, the time of the cancel,
// when the money was sent back.
export function getStatusReachedAt(order: OrderDetails): Date | null {
  return order.history.find((entry) => entry.status === order.status)?.changedAt ?? null;
}

// The minutes of the trip given at the order: the expected delivery minus the creation time.
export function getTravelMinutes(order: OrderDetails): number | null {
  return order.estimatedDeliveryAt === null
    ? null
    : Math.round((order.estimatedDeliveryAt.getTime() - order.createdAt.getTime()) / MS_PER_MINUTE);
}

export function getPriceBreakdown(order: OrderDetails): { base: number; surcharge: number | null } {
  return splitPrice(order.price, order.priceCoefficient);
}
