import { ORDER_STATUS, type OrderDetails, PAYMENT_STATUS } from '@/shared/api';
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
function getPaidAt(order: OrderDetails): Date | null {
  return order.history.find((entry) => entry.status === ORDER_STATUS.CONFIRMED)?.changedAt ?? null;
}

// The time the order reached its current status: for a cancelled order, the time of the cancel,
// when the money was sent back.
function getStatusReachedAt(order: OrderDetails): Date | null {
  return order.history.find((entry) => entry.status === order.status)?.changedAt ?? null;
}

// The time shown next to the payment status: when it was paid or when the money went back.
export function getPaymentTime(order: OrderDetails, view: PaymentView): Date | null {
  let time: Date | null = null;

  if (view === PAYMENT_VIEW.PAID) {
    time = getPaidAt(order);
  } else if (view === PAYMENT_VIEW.REFUNDED) {
    time = getStatusReachedAt(order);
  }

  return time;
}

// The minutes of the trip given at the order. Not counted from estimatedDeliveryAt: the arrival
// estimate moves it while the courier carries the order.
export function getTravelMinutes(order: OrderDetails): number | null {
  return order.estimatedMinutes;
}
