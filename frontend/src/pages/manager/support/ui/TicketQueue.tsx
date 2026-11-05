import { ChatsCircleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useMinuteNow } from '@/shared/lib/clock';
import type { SupportTicketsPage } from '@/shared/support-api';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Pagination } from '@/shared/ui/pagination';
import { Spinner } from '@/shared/ui/spinner';
import { SUPPORT_PAGE_SIZE } from '../config/params';
import { MANAGER_SUPPORT_TEXTS as TEXTS } from '../config/texts';
import type { QueueEmpty } from '../lib/queue-empty';
import type { Loaded } from '@/shared/lib/async';
import { TicketRow } from './TicketRow';

type TicketQueueProps = {
  list: Loaded<SupportTicketsPage>;
  page: number;
  empty: QueueEmpty;
  isFiltered: boolean;
  selectedId: number | null;
  onSelect: (ticketId: number) => void;
  onPage: (page: number) => void;
};

function QueueBody({
  list,
  page,
  empty,
  isFiltered,
  selectedId,
  onSelect,
  onPage,
}: TicketQueueProps) {
  const now = new Date(useMinuteNow());
  const data = list.data;

  if (data === null) {
    return list.message === null ? (
      <div className="grid flex-1 place-items-center py-24">
        <Spinner />
      </div>
    ) : (
      <div className="flex flex-col items-start gap-3 p-2">
        <InlineAlert variant="error" title={list.message} />
        <Button variant="secondary" onClick={list.reload}>
          {TEXTS.RETRY}
        </Button>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={isFiltered ? MagnifyingGlassIcon : ChatsCircleIcon}
        title={empty.title}
        text={empty.text}
      />
    );
  }

  return (
    <>
      <ul aria-label={TEXTS.LIST} className="flex flex-col gap-0.5">
        {data.items.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            isSelected={ticket.id === selectedId}
            now={now}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {data.total > SUPPORT_PAGE_SIZE ? (
        <div className="mt-auto border-t border-border px-2 pt-3">
          <Pagination
            page={page}
            totalPages={Math.ceil(data.total / SUPPORT_PAGE_SIZE)}
            total={data.total}
            pageSize={SUPPORT_PAGE_SIZE}
            onChange={onPage}
          />
        </div>
      ) : null}
    </>
  );
}

export function TicketQueue(props: TicketQueueProps) {
  return (
    <div className="flex min-h-0 flex-col overflow-y-auto rounded-lg bg-surface p-2 shadow-md lg:h-160 dark:border dark:border-border">
      <QueueBody {...props} />
    </div>
  );
}
