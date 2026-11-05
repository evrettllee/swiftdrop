import { CaretRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { getSupportTicketPath } from '@/shared/routes';
import type { MyTicketItem } from '@/shared/support-api';
import { dayTime, previewLine, ticketStateOf } from '../lib/ticket-lines';
import { TicketStateMark } from './TicketState';

const CARET = (
  <CaretRightIcon
    size={ICON_SIZE.MEDIUM}
    weight={ICON_WEIGHT}
    aria-hidden="true"
    className="shrink-0 text-fg-secondary"
  />
);

type TicketCardProps = {
  ticket: MyTicketItem;
  supportPath: string;
  now: Date;
};

export function TicketCard({ ticket, supportPath, now }: TicketCardProps) {
  const time = dayTime(ticket.lastMessageAt, now);
  const preview = previewLine(ticket);

  return (
    <Link
      to={getSupportTicketPath(supportPath, ticket.id)}
      className={`flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-md hover:bg-surface-muted lg:grid lg:grid-cols-[minmax(0,1fr)_180px_152px_20px] lg:items-center lg:gap-4 dark:border dark:border-border ${COLOR_TRANSITION_CLASS}`}
    >
      <div className="flex min-w-0 flex-col gap-2 lg:gap-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate font-semibold">{ticket.title}</h3>
          <span className="lg:hidden">{CARET}</span>
        </div>
        {preview === '' ? null : (
          <p className="truncate text-small text-fg-secondary tabular-nums">{preview}</p>
        )}
      </div>
      <span className="hidden text-small text-fg-secondary tabular-nums lg:block">{time}</span>
      <div className="flex items-center justify-between gap-3">
        <TicketStateMark state={ticketStateOf(ticket)} />
        <span className="text-caption text-fg-secondary tabular-nums lg:hidden">{time}</span>
      </div>
      <span className="hidden lg:block">{CARET}</span>
    </Link>
  );
}
