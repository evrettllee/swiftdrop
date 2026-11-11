import { memo } from 'react';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { getNameInitials } from '@/shared/lib/format';
import type { SupportTicketItem } from '@/shared/support-api';
import { Avatar } from '@/shared/ui/avatar';
import { MANAGER_SUPPORT_TEXTS as TEXTS, ROLE_TAGS } from '../config/texts';
import { LONG_WAIT_MINUTES, rowTime, waitingMinutes } from '../lib/ticket-lines';

function RowMark({ ticket, now }: { ticket: SupportTicketItem; now: Date }) {
  const minutes = waitingMinutes(ticket);

  if (!ticket.awaitingStaff || minutes === null) {
    return (
      <span className="shrink-0 text-caption text-fg-secondary tabular-nums">
        {rowTime(ticket.lastMessageAt, now)}
      </span>
    );
  }

  const isLong = minutes >= LONG_WAIT_MINUTES;

  return (
    <span
      className={joinClassNames(
        'inline-flex shrink-0 items-center gap-1.5 text-caption tabular-nums',
        isLong ? 'font-semibold text-warning' : 'text-fg-secondary',
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
      <span className="hidden lg:inline">{TEXTS.waiting(minutes)}</span>
      <span className="lg:hidden">{TEXTS.waitingShort(minutes)}</span>
    </span>
  );
}

type TicketRowProps = {
  ticket: SupportTicketItem;
  isSelected: boolean;
  now: Date;
  onSelect: (ticketId: number) => void;
};

export const TicketRow = memo(function TicketRow({
  ticket,
  isSelected,
  now,
  onSelect,
}: TicketRowProps) {
  return (
    <li>
      <button
        type="button"
        aria-current={isSelected ? 'true' : undefined}
        onClick={() => onSelect(ticket.id)}
        className={joinClassNames(
          'grid w-full grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md px-2 py-3 text-start',
          COLOR_TRANSITION_CLASS,
          isSelected ? 'bg-selected' : 'hover:bg-surface-muted',
        )}
      >
        <span className="row-span-3">
          <Avatar initials={getNameInitials(ticket.author.name)} size="small" />
        </span>
        <span className="flex min-w-0 items-center gap-2 text-small">
          <span className="truncate">{ticket.author.name}</span>
          <span className="shrink-0 rounded-sm border border-border px-1.5 text-caption text-fg-secondary">
            {ROLE_TAGS[ticket.author.role]}
          </span>
          <span className="ms-auto flex shrink-0">
            <RowMark ticket={ticket} now={now} />
          </span>
        </span>
        <span className="truncate font-semibold">{ticket.title}</span>
        <span className="truncate text-small text-fg-secondary">
          {ticket.lastMessage?.text ?? ''}
        </span>
      </button>
    </li>
  );
});
