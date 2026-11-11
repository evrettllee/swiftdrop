import { LockIcon, ProhibitIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { supportSendError } from '@/features/support-thread';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { SUPPORT_SEND_FAILURE } from '@/shared/support-api';
import { ChatComposerField } from '@/shared/ui/chat';
import { DIALOG_TEXTS, REPLY_PLACEHOLDERS } from '../config/dialog-texts';
import { closedLine } from '../lib/ticket-lines';
import type { TicketModel } from '../model/useTicket';

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

  return (
    <ChatComposerField
      label={REPLY_PLACEHOLDERS[ticket.author.role]}
      placeholder={REPLY_PLACEHOLDERS[ticket.author.role]}
      value={send.text}
      isSending={send.isSending}
      error={supportSendError(send, DIALOG_TEXTS.TICKET_CLOSED)}
      onChange={send.setText}
      onSubmit={send.send}
    />
  );
}
