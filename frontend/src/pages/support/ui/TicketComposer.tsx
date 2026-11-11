import { LockIcon, PlusIcon, ProhibitIcon } from '@phosphor-icons/react';
import { supportSendError } from '@/features/support-thread';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { getNewTicketPath } from '@/shared/routes';
import { SUPPORT_SEND_FAILURE } from '@/shared/support-api';
import { LinkButton } from '@/shared/ui/button';
import { ChatComposerField } from '@/shared/ui/chat';
import { THREAD_TEXTS } from '../config/thread-texts';
import type { MyTicketModel } from '../model/useMyTicket';

const ICON = { size: ICON_SIZE.MEDIUM, weight: ICON_WEIGHT, 'aria-hidden': true } as const;
const NOTE_CLASS =
  'flex shrink-0 items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-small text-fg-secondary';

type TicketComposerProps = {
  model: MyTicketModel;
  supportPath: string;
};

export function TicketComposer({ model, supportPath }: TicketComposerProps) {
  const { ticket, send } = model;

  if (ticket === null) {
    return null;
  }

  if (model.isRefused) {
    return (
      <p role="status" className={NOTE_CLASS}>
        <ProhibitIcon {...ICON} className="shrink-0" />
        {THREAD_TEXTS.NO_ACCESS}
      </p>
    );
  }

  if (!model.isOpen) {
    return (
      <div className="flex shrink-0 flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          {send.failure === SUPPORT_SEND_FAILURE.CLOSED ? (
            <p role="alert" className="text-small text-danger">
              {THREAD_TEXTS.TICKET_CLOSED}
            </p>
          ) : null}
          <p className="flex items-center gap-2 text-small text-fg-secondary">
            <LockIcon {...ICON} className="shrink-0" />
            {THREAD_TEXTS.CLOSED_NOTE}
          </p>
        </div>
        <LinkButton
          variant="secondary"
          icon={<PlusIcon {...ICON} />}
          to={getNewTicketPath(supportPath, ticket.order?.orderId ?? null)}
        >
          {THREAD_TEXTS.NEW}
        </LinkButton>
      </div>
    );
  }

  return (
    <ChatComposerField
      label={THREAD_TEXTS.PLACEHOLDER}
      placeholder={THREAD_TEXTS.PLACEHOLDER}
      value={send.text}
      isSending={send.isSending}
      error={supportSendError(send, THREAD_TEXTS.TICKET_CLOSED)}
      onChange={send.setText}
      onSubmit={send.send}
    />
  );
}
