import { formatOrderNumber, getOrderStatusMeta, STATUS_AUDIENCE } from '@/entities/order';
import type { OrderStatus } from '@/shared/api';
import { formatShortDateTime, formatShortDay, formatTime } from '@/shared/lib/format';
import { SUPPORT_TICKET_STATUS } from '@/shared/staff-api';
import type { MyTicketItem } from '@/shared/support-api';
import { SUPPORT_TEXTS, TICKET_STATE, type TicketState } from '../config/texts';

function isSameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

export function ticketStateOf(ticket: Pick<MyTicketItem, 'status' | 'awaitingStaff'>): TicketState {
  if (ticket.status === SUPPORT_TICKET_STATUS.CLOSED) {
    return TICKET_STATE.CLOSED;
  }

  return ticket.awaitingStaff ? TICKET_STATE.AWAITING : TICKET_STATE.ANSWERED;
}

export function dayTime(at: Date, now: Date): string {
  return isSameDay(at, now) ? `${SUPPORT_TEXTS.TODAY}, ${formatTime(at)}` : formatShortDateTime(at);
}

export function previewLine(ticket: Pick<MyTicketItem, 'order' | 'lastMessage'>): string {
  const parts: string[] = [];

  if (ticket.order !== null) {
    parts.push(SUPPORT_TEXTS.orderNumber(formatOrderNumber(ticket.order.orderId)));
  }

  if (ticket.lastMessage !== null) {
    const who = ticket.lastMessage.fromStaff ? SUPPORT_TEXTS.STAFF : SUPPORT_TEXTS.YOU;
    parts.push(SUPPORT_TEXTS.preview(who, ticket.lastMessage.text));
  }

  return SUPPORT_TEXTS.joined(parts);
}

export function inlineStatus(status: OrderStatus): string {
  const { label } = getOrderStatusMeta(status, STATUS_AUDIENCE.CLIENT);

  return `${label.charAt(0).toLocaleLowerCase()}${label.slice(1)}`;
}

export type OrderSummary = {
  at: Date | null;
  status: OrderStatus | null;
  address: string | null;
};

export function orderSummary(order: OrderSummary, now: Date, withAddress: boolean): string {
  const parts: string[] = [];

  if (order.at !== null) {
    parts.push(isSameDay(order.at, now) ? SUPPORT_TEXTS.TODAY : formatShortDay(order.at));
  }

  if (order.status !== null) {
    parts.push(
      parts.length === 0
        ? getOrderStatusMeta(order.status, STATUS_AUDIENCE.CLIENT).label
        : inlineStatus(order.status),
    );
  }

  if (withAddress && order.address !== null) {
    parts.push(order.address);
  }

  return SUPPORT_TEXTS.joined(parts);
}
