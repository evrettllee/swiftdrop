import { ChatsCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useMinuteNow } from '@/shared/lib/clock';
import { SUPPORT_TICKET_STATUS, type SupportTicketStatus } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Spinner } from '@/shared/ui/spinner';
import { SUPPORT_TEXTS } from '../config/texts';
import type { MyTickets } from '../model/useMyTickets';
import { TicketCard } from './TicketCard';

type TicketListProps = {
  status: SupportTicketStatus;
  tickets: MyTickets;
  supportPath: string;
  newButton: ReactNode;
};

export function TicketList({ status, tickets, supportPath, newButton }: TicketListProps) {
  const now = new Date(useMinuteNow());
  const { first, items, more } = tickets;

  if (first.data === null && first.message !== null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <InlineAlert variant="error" title={first.message} />
        <Button variant="secondary" onClick={first.reload}>
          {SUPPORT_TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  if (first.data === null) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    const isOpen = status === SUPPORT_TICKET_STATUS.OPEN;

    return (
      <EmptyState
        icon={ChatsCircleIcon}
        title={SUPPORT_TEXTS.EMPTY_TITLE}
        text={isOpen ? SUPPORT_TEXTS.EMPTY_OPEN : SUPPORT_TEXTS.EMPTY_CLOSED}
      >
        {isOpen ? newButton : null}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label={SUPPORT_TEXTS.LIST} className="flex flex-col gap-4">
        {items.map((ticket) => (
          <li key={ticket.id}>
            <TicketCard ticket={ticket} supportPath={supportPath} now={now} />
          </li>
        ))}
      </ul>
      {more.isFailed ? <InlineAlert variant="error" title={SUPPORT_TEXTS.LOAD_FAILED} /> : null}
      {more.hasMore ? (
        <div className="flex justify-center">
          <Button variant="secondary" loading={more.isLoading} onClick={more.loadMore}>
            {SUPPORT_TEXTS.SHOW_MORE}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
