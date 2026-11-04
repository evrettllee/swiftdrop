import { LockIcon, ProhibitIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { SUPPORT_SEND_FAILURE, type SupportSendFailure } from '@/shared/support-api';
import { ChatComposerField } from '@/shared/ui/chat';
import { DIALOG_TEXTS, REPLY_PLACEHOLDERS } from '../config/dialog-texts';
import { closedLine } from '../lib/ticket-lines';
import type { TicketModel } from '../model/useTicket';

const FAILURE_TEXTS: Record<SupportSendFailure, string> = {
  [SUPPORT_SEND_FAILURE.CLOSED]: DIALOG_TEXTS.TICKET_CLOSED,
  [SUPPORT_SEND_FAILURE.TOO_MANY]: DIALOG_TEXTS.TOO_MANY,
  [SUPPORT_SEND_FAILURE.NETWORK]: DIALOG_TEXTS.NOT_SENT,
  [SUPPORT_SEND_FAILURE.OTHER]: DIALOG_TEXTS.SEND_FAILED,
};

function FooterNote({ icon: NoteIcon, text, role }: { icon: Icon; text: string; role?: 'status' }) {
  return (
    <p
      role={role}
      className="flex shrink-0 items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-small text-fg-secondary"
    >
      <NoteIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0"
      />
      {text}
    </p>
  );
}

export function TicketFooter({ model }: { model: TicketModel }) {
  const { ticket, send } = model;

  if (ticket === null) {
    return null;
  }

  if (model.isRefused) {
    return <FooterNote icon={ProhibitIcon} text={DIALOG_TEXTS.NO_ACCESS} role="status" />;
  }

  const closed = closedLine(ticket);

  if (!model.isOpen || closed !== null) {
    return (
      <div className="flex shrink-0 flex-col">
        {send.failure === SUPPORT_SEND_FAILURE.CLOSED ? (
          <p role="alert" className="px-4 pt-3 text-small text-danger">
            {DIALOG_TEXTS.TICKET_CLOSED}
          </p>
        ) : null}
        <FooterNote icon={LockIcon} text={closed ?? DIALOG_TEXTS.CLOSED} />
      </div>
    );
  }

  const error =
    send.failure === null ? null : (
      <>
        {FAILURE_TEXTS[send.failure]}
        {send.failure === SUPPORT_SEND_FAILURE.NETWORK ? (
          <button
            type="button"
            onClick={send.send}
            className="ms-1 font-semibold text-accent underline"
          >
            {DIALOG_TEXTS.RETRY}
          </button>
        ) : null}
      </>
    );

  return (
    <ChatComposerField
      label={REPLY_PLACEHOLDERS[ticket.author.role]}
      placeholder={REPLY_PLACEHOLDERS[ticket.author.role]}
      value={send.text}
      isSending={send.isSending}
      error={error}
      onChange={send.setText}
      onSubmit={send.send}
    />
  );
}
