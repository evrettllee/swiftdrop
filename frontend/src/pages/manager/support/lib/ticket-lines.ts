import { APP_LOCALE } from '@/shared/config';
import { formatPhone, formatShortDay, formatShortDateTime, formatTime } from '@/shared/lib/format';
import type { SupportTicket, SupportTicketItem } from '@/shared/support-api';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import { ROLE_NAMES } from '../config/texts';

const SECONDS_PER_MINUTE = 60;
export const LONG_WAIT_MINUTES = 15;

const dayMonthFormat = new Intl.DateTimeFormat(APP_LOCALE, { day: '2-digit', month: '2-digit' });

function isSameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

export function waitingMinutes(item: Pick<SupportTicketItem, 'waitingSec'>): number | null {
  return item.waitingSec === null ? null : Math.floor(item.waitingSec / SECONDS_PER_MINUTE);
}

export function rowTime(at: Date, now: Date): string {
  return isSameDay(at, now) ? formatTime(at) : formatShortDay(at);
}

export function authorLine(ticket: SupportTicket, now: Date): string {
  const { author } = ticket;
  const phone = author.phone === null ? null : formatPhone(author.phone);
  const opened = isSameDay(ticket.createdAt, now)
    ? DIALOG_TEXTS.openedAt(formatTime(ticket.createdAt))
    : DIALOG_TEXTS.openedOn(formatShortDateTime(ticket.createdAt));

  return `${DIALOG_TEXTS.author(author.name, ROLE_NAMES[author.role], phone)}, ${opened}`;
}

export function closedLine(ticket: Pick<SupportTicket, 'closedAt' | 'closedBy'>): string | null {
  const { closedAt, closedBy } = ticket;

  if (closedAt === null) {
    return null;
  }

  const date = `${dayMonthFormat.format(closedAt)}, ${formatTime(closedAt)}`;

  const line = DIALOG_TEXTS.closedAt(date);

  return closedBy === null ? line : DIALOG_TEXTS.closedBy(line, closedBy.name);
}
