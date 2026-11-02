import { CaretRightIcon, ChatTextIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { getManagerTicketPath } from '@/shared/routes';
import type { ManagerOrderTicket } from '@/shared/staff-api';
import { MANAGER_ORDER_TEXTS } from '../config/texts';
import { ticketCaption, ticketTitle } from '../lib/order-facts';
import { Panel } from './Panel';

type TicketsPanelProps = {
  tickets: readonly ManagerOrderTicket[];
  className?: string;
};

export function TicketsPanel({ tickets, className = '' }: TicketsPanelProps) {
  const nowMs = useMinuteNow();

  return (
    <Panel title={MANAGER_ORDER_TEXTS.SECTION_TICKETS} isPlainOnPhone className={className}>
      <ul className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link
              to={getManagerTicketPath(ticket.id)}
              className={`flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 hover:bg-selected ${COLOR_TRANSITION_CLASS}`}
            >
              <ChatTextIcon
                size={ICON_SIZE.MEDIUM}
                weight={ICON_WEIGHT}
                aria-hidden="true"
                className="shrink-0 text-accent"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{ticketTitle(ticket)}</span>
                <span className="hidden text-small text-fg-secondary tabular-nums lg:inline">
                  {ticketCaption(ticket, nowMs, true)}
                </span>
                <span className="text-small text-fg-secondary tabular-nums lg:hidden">
                  {ticketCaption(ticket, nowMs, false)}
                </span>
              </span>
              <CaretRightIcon
                size={ICON_SIZE.MEDIUM}
                weight={ICON_WEIGHT}
                aria-hidden="true"
                className="shrink-0 text-fg-secondary"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
