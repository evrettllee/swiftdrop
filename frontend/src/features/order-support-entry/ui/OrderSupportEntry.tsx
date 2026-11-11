import { CaretRightIcon, LifebuoyIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import type { OrderSupportTicket } from '@/shared/api';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { getNewTicketPath, getSupportTicketPath } from '@/shared/routes';
import { CountBadge } from '@/shared/ui/badge';
import { ORDER_SUPPORT_TEXTS } from '../config/texts';
import { entryLabel, entryStatusLine } from '../lib/entry-lines';

export type OrderSupportPlacement = 'start' | 'center';

const BUTTON_PLACEMENT_CLASSES: Record<OrderSupportPlacement, string> = {
  start: '-ms-4 self-start',
  center: 'self-center',
};

type OrderSupportEntryProps = {
  orderId: number;
  ticket: OrderSupportTicket | null;
  supportPath: string;
  placement: OrderSupportPlacement;
};

export function OrderSupportEntry({
  orderId,
  ticket,
  supportPath,
  placement,
}: OrderSupportEntryProps) {
  const now = new Date(useMinuteNow());

  if (ticket === null) {
    return (
      <Link
        to={getNewTicketPath(supportPath, orderId)}
        className={`inline-flex min-h-11 items-center gap-1 rounded-md px-4 font-semibold text-accent hover:bg-selected ${BUTTON_PLACEMENT_CLASSES[placement]} ${COLOR_TRANSITION_CLASS}`}
      >
        <LifebuoyIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        {ORDER_SUPPORT_TEXTS.NEED_HELP}
      </Link>
    );
  }

  return (
    <Link
      to={getSupportTicketPath(supportPath, ticket.ticketId)}
      aria-label={entryLabel(ticket, now)}
      className={`flex min-h-14 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-fg hover:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
    >
      <span className="relative flex shrink-0 text-accent">
        <LifebuoyIcon size={ICON_SIZE.LARGE} weight={ICON_WEIGHT} aria-hidden="true" />
        <CountBadge count={ticket.unreadCount} />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="font-semibold">{ORDER_SUPPORT_TEXTS.TICKET}</span>
        <span className="text-small text-pretty text-fg-secondary tabular-nums">
          {entryStatusLine(ticket, now)}
        </span>
      </span>
      <CaretRightIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
    </Link>
  );
}
