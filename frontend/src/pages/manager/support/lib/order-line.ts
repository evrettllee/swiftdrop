import {
  cancelledLine,
  deliveredLine,
  getOrderStatusMeta,
  PAYMENT_VIEW,
  PAYMENT_VIEW_LABELS,
  STATUS_AUDIENCE,
} from '@/entities/order';
import { ORDER_STATUS, type OrderStatus } from '@/shared/api';
import { ORDER_ACTOR, type ManagerOrderDetails, PAYMENT_STATE } from '@/shared/staff-api';
import type { SupportTicket } from '@/shared/support-api';
import { DIALOG_TEXTS } from '../config/dialog-texts';

export type OrderLine = { text: string; phone: string | null };

type TicketOrder = NonNullable<SupportTicket['order']>;

function statusLabel(status: OrderStatus): string {
  return getOrderStatusMeta(status, STATUS_AUDIENCE.STAFF).label;
}

function lowerFirst(text: string): string {
  return `${text.charAt(0).toLocaleLowerCase()}${text.slice(1)}`;
}

function cancelText(details: ManagerOrderDetails): string {
  const entry = details.history.findLast((item) => item.status === details.status) ?? null;
  const known =
    entry !== null && entry.actor === ORDER_ACTOR.STAFF && entry.actorName === null ? null : entry;
  const line = cancelledLine(
    known,
    details.finishedAt ?? details.statusChangedAt,
    known?.actorName ?? '',
  );

  return details.payment.state === PAYMENT_STATE.REFUNDED
    ? `${line}, ${lowerFirst(PAYMENT_VIEW_LABELS[PAYMENT_VIEW.REFUNDED])}`
    : line;
}

export function orderLine(order: TicketOrder, details: ManagerOrderDetails | null): OrderLine {
  const fallback = {
    text: DIALOG_TEXTS.statusAddress(statusLabel(order.status), order.deliveryAddress),
    phone: null,
  };

  if (details === null || details.id !== order.orderId) {
    return fallback;
  }

  if (details.status === ORDER_STATUS.CANCELLED || details.status === ORDER_STATUS.REJECTED) {
    return { text: cancelText(details), phone: null };
  }

  if (details.status === ORDER_STATUS.DELIVERED) {
    return {
      text: deliveredLine(details.finishedAt ?? details.statusChangedAt),
      phone: null,
    };
  }

  if (details.courier === null) {
    return {
      text: DIALOG_TEXTS.statusAddress(statusLabel(details.status), order.deliveryAddress),
      phone: null,
    };
  }

  return {
    text: DIALOG_TEXTS.courierLine(statusLabel(details.status), details.courier.name),
    phone: details.courier.phone,
  };
}
