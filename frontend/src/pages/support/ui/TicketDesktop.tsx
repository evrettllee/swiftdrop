import { SupportLog } from '@/features/support-thread';
import { formatFullDateTime } from '@/shared/lib/format';
import type { SupportMessage } from '@/shared/support-api';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { SUPPORT_TEXTS } from '../config/texts';
import { THREAD_TEXTS } from '../config/thread-texts';
import { ticketStateOf } from '../lib/ticket-lines';
import type { MyTicketModel } from '../model/useMyTicket';
import type { SupportRole } from '../model/useSupportRole';
import { TicketComposer } from './TicketComposer';
import { TicketOrderAside } from './TicketOrder';
import { TicketStateMark } from './TicketState';

const authorOf = (message: SupportMessage, isOwn: boolean) =>
  isOwn ? THREAD_TEXTS.YOU : message.authorName;

type TicketDesktopProps = {
  model: MyTicketModel;
  ticket: NonNullable<MyTicketModel['ticket']>;
  role: SupportRole;
};

export function TicketDesktop({ model, ticket, role }: TicketDesktopProps) {
  const { order } = ticket;

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-140 flex-col gap-6 lg:gap-8">
      <header className="flex shrink-0 flex-col gap-4">
        <Breadcrumbs
          label={THREAD_TEXTS.BREADCRUMBS}
          parent={{ label: SUPPORT_TEXTS.TITLE, to: role.supportPath }}
          current={ticket.title}
        />
        <div className="flex flex-wrap items-baseline gap-4">
          <h1 className="text-heading-md font-semibold text-balance">{ticket.title}</h1>
          <TicketStateMark state={ticketStateOf(ticket)} />
        </div>
        <p className="text-small text-fg-secondary tabular-nums">
          {THREAD_TEXTS.createdAt(formatFullDateTime(ticket.createdAt))}
        </p>
      </header>
      <div
        className={`grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-6 ${order === null ? '' : 'grid-cols-[minmax(0,1fr)_400px]'}`}
      >
        <section
          aria-label={THREAD_TEXTS.MESSAGES}
          className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-surface shadow-md dark:border dark:border-border"
        >
          <SupportLog thread={model.thread} label={THREAD_TEXTS.MESSAGES} authorOf={authorOf} />
          <div className="shrink-0 border-t border-border">
            <TicketComposer model={model} supportPath={role.supportPath} />
          </div>
        </section>
        {order === null ? null : (
          <TicketOrderAside order={order} to={role.orderPath(order.orderId, order.status)} />
        )}
      </div>
    </div>
  );
}
