import type { OrderSupportTicket } from '@/shared/api';
import { formatCount, formatShortDateTime, formatTime, pluralize } from '@/shared/lib/format';
import { NEW_MESSAGES_FORMS, ORDER_SUPPORT_TEXTS } from '../config/texts';

function isSameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

export function entryStatusLine(ticket: OrderSupportTicket, now: Date): string {
  const state = ticket.awaitingStaff ? ORDER_SUPPORT_TEXTS.AWAITING : ORDER_SUPPORT_TEXTS.ANSWERED;
  const at = ticket.lastMessageAt;
  const time = isSameDay(at, now) ? formatTime(at) : formatShortDateTime(at);

  return ORDER_SUPPORT_TEXTS.joined([state, time]);
}

export function entryLabel(ticket: OrderSupportTicket, now: Date): string {
  const parts = [ORDER_SUPPORT_TEXTS.TICKET, entryStatusLine(ticket, now)];

  if (ticket.unreadCount > 0) {
    parts.push(
      `${formatCount(ticket.unreadCount)} ${pluralize(ticket.unreadCount, NEW_MESSAGES_FORMS)}`,
    );
  }

  return ORDER_SUPPORT_TEXTS.joined(parts);
}
