import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { SupportLog } from '@/features/support-thread';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useBodyScrollLock } from '@/shared/lib/dom';
import type { SupportMessage } from '@/shared/support-api';
import { THREAD_TEXTS } from '../config/thread-texts';
import type { MyTicketModel } from '../model/useMyTicket';
import type { SupportRole } from '../model/useSupportRole';
import { TicketComposer } from './TicketComposer';
import { TicketOrderCard } from './TicketOrder';

const authorOf = (message: SupportMessage, isOwn: boolean) =>
  isOwn ? undefined : message.authorName;

type TicketScreenProps = {
  model: MyTicketModel;
  ticket: NonNullable<MyTicketModel['ticket']>;
  role: SupportRole;
};

export function TicketScreen({ model, ticket, role }: TicketScreenProps) {
  const title = useRef<HTMLHeadingElement>(null);
  const { order } = ticket;

  useBodyScrollLock(true);

  useEffect(() => {
    title.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="ticket-screen-title"
      className="fixed inset-0 z-40 flex flex-col bg-page"
    >
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border bg-surface py-2 ps-1 pe-3">
        <Link
          to={role.supportPath}
          aria-label={THREAD_TEXTS.BACK}
          className="grid size-11 shrink-0 place-items-center rounded-md text-fg hover:bg-selected"
        >
          <ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </Link>
        <div className="flex min-w-0 grow flex-col">
          <h1
            ref={title}
            id="ticket-screen-title"
            tabIndex={-1}
            className="truncate font-semibold outline-none"
          >
            {ticket.title}
          </h1>
          <p className="truncate text-small text-fg-secondary">{THREAD_TEXTS.SUPPORT_NAME}</p>
        </div>
      </header>
      <SupportLog
        thread={model.thread}
        label={THREAD_TEXTS.MESSAGES}
        authorOf={authorOf}
        lead={
          order === null ? null : (
            <TicketOrderCard order={order} to={role.orderPath(order.orderId, order.status)} />
          )
        }
      />
      <div className="shrink-0 border-t border-border bg-surface">
        <TicketComposer model={model} supportPath={role.supportPath} />
      </div>
    </section>
  );
}
