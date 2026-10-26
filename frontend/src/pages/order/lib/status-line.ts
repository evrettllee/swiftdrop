import {
  ORDER_CANCELLED_BY,
  ORDER_STATUS,
  type OrderDetails,
  type OrderStatus,
} from '@/shared/api';
import { MS_PER_MINUTE } from '@/shared/config';
import { formatTime } from '@/shared/lib/format';
import { PAYMENT_VIEW } from '../config/payment';
import { UNPAID_ORDER_TTL_MINUTES } from '../config/payment-return';
import { STATUS_LINE_TEXTS } from '../config/texts';
import { ORDER_COURIER_TEXTS } from '../config/tracking';
import type { OrderTrackingState } from '../model/tracking-state';
import { minutesSince, minutesUntil } from './minutes';
import { getPaymentView } from './payment';

export const STATUS_LINE_ICON = {
  CLOCK: 'clock',
  FAILURE: 'x-circle',
  OFFLINE: 'wifi-x',
  SUCCESS: 'check-circle',
} as const;

export type StatusLineIcon = (typeof STATUS_LINE_ICON)[keyof typeof STATUS_LINE_ICON];

export type StatusLine = { icon: StatusLineIcon | null; title: string; text: string | null };

export type StatusLineSource = {
  order: OrderDetails;
  payment: { isChecking: boolean; isFailed: boolean };
  tracking: Pick<
    OrderTrackingState,
    'estimatedDeliveryAt' | 'pickupEtaAt' | 'isPositionStale' | 'positionReceivedAt'
  >;
  nowMs: number;
};

const T = STATUS_LINE_TEXTS;

function reachedAt(order: OrderDetails, status: OrderStatus): Date | null {
  return order.history.find((entry) => entry.status === status)?.changedAt ?? null;
}

function paymentLine({ order, payment }: StatusLineSource): StatusLine {
  const deadline = formatTime(
    new Date(order.createdAt.getTime() + UNPAID_ORDER_TTL_MINUTES * MS_PER_MINUTE),
  );

  if (payment.isChecking) {
    return { icon: null, title: T.CHECKING_TITLE, text: T.CHECKING };
  }

  return payment.isFailed
    ? { icon: STATUS_LINE_ICON.FAILURE, title: T.FAILED_TITLE, text: T.failed(deadline) }
    : { icon: STATUS_LINE_ICON.CLOCK, title: T.WAITING_TITLE, text: T.waiting(deadline) };
}

function courierLine({ order, tracking, nowMs }: StatusLineSource): StatusLine {
  if (tracking.isPositionStale && tracking.positionReceivedAt !== null) {
    const minutes = minutesSince(tracking.positionReceivedAt, nowMs);

    return { icon: STATUS_LINE_ICON.OFFLINE, title: T.OFFLINE_TITLE, text: T.offline(minutes) };
  }

  const deliveryAt = tracking.estimatedDeliveryAt ?? order.estimatedDeliveryAt;
  const deliveryBy = deliveryAt === null ? null : T.deliveryBy(formatTime(deliveryAt));

  if (order.status !== ORDER_STATUS.COURIER_ASSIGNED) {
    const title =
      deliveryAt === null ? T.CARRYING : T.deliveryIn(minutesUntil(deliveryAt.getTime(), nowMs));

    return { icon: null, title, text: deliveryBy };
  }

  if (tracking.pickupEtaAt !== null) {
    const minutes = minutesUntil(tracking.pickupEtaAt.getTime(), nowMs);

    return { icon: null, title: T.pickupIn(minutes), text: deliveryBy };
  }

  return { icon: null, title: deliveryBy ?? T.HEADING_TO_PICKUP, text: null };
}

function cancelledLine(order: OrderDetails): StatusLine {
  let text: string = T.UNPAID_CANCELLED;

  if (getPaymentView(order) !== PAYMENT_VIEW.UNPAID) {
    text = T.REFUNDED;
  } else if (order.cancelledBy === ORDER_CANCELLED_BY.SYSTEM) {
    text = T.UNPAID_EXPIRED(UNPAID_ORDER_TTL_MINUTES);
  }

  return { icon: STATUS_LINE_ICON.FAILURE, title: T.CANCELLED_TITLE, text };
}

function finishedLine(order: OrderDetails): StatusLine {
  if (order.status === ORDER_STATUS.DELIVERED) {
    const deliveredAt = reachedAt(order, ORDER_STATUS.DELIVERED);

    return {
      icon: STATUS_LINE_ICON.SUCCESS,
      title: deliveredAt === null ? T.DELIVERED : T.deliveredAt(formatTime(deliveredAt)),
      text: T.recipient(order.recipient.name),
    };
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    return cancelledLine(order);
  }

  const isPaid = getPaymentView(order) !== PAYMENT_VIEW.UNPAID;

  return {
    icon: STATUS_LINE_ICON.FAILURE,
    title: T.REJECTED_TITLE,
    text: isPaid ? T.REJECTED_REFUND : null,
  };
}

export function getStatusLine(source: StatusLineSource): StatusLine {
  switch (source.order.status) {
    case ORDER_STATUS.PENDING:
      return paymentLine(source);
    case ORDER_STATUS.CONFIRMED:
    case ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT:
      return { icon: null, title: ORDER_COURIER_TEXTS.SEARCHING, text: T.SEARCHING };
    case ORDER_STATUS.COURIER_ASSIGNED:
    case ORDER_STATUS.PICKED_UP:
    case ORDER_STATUS.IN_TRANSIT:
      return courierLine(source);
    default:
      return finishedLine(source.order);
  }
}
