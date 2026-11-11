import { CheckCircleIcon } from '@phosphor-icons/react';
import { SupportLog } from '@/features/support-thread';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Spinner } from '@/shared/ui/spinner';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import { authorLine } from '../lib/ticket-lines';
import type { TicketModel } from '../model/useTicket';
import { CloseTicketDialog } from './CloseTicketDialog';
import { TicketFooter } from './TicketFooter';
import { TicketOrderCard } from './TicketOrderCard';

export function ClosedMark() {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-small">
      <span aria-hidden="true" className="size-2 rounded-full bg-success" />
      {DIALOG_TEXTS.CLOSED}
    </span>
  );
}

export function TicketLoadState({ model }: { model: TicketModel }) {
  const { details } = model;

  return details.message === null ? (
    <div className="grid flex-1 place-items-center">
      <Spinner />
    </div>
  ) : (
    <div className="flex flex-col items-start gap-3 p-6">
      <InlineAlert
        variant="error"
        title={details.isMissing ? DIALOG_TEXTS.NOT_FOUND : details.message}
      />
      {details.isMissing ? null : (
        <Button variant="secondary" onClick={details.reload}>
          {DIALOG_TEXTS.RETRY}
        </Button>
      )}
    </div>
  );
}

export function TicketPanel({ model }: { model: TicketModel }) {
  const now = new Date(useMinuteNow());
  const { ticket } = model;

  return (
    <section
      aria-label={DIALOG_TEXTS.LABEL}
      className="flex h-160 min-w-0 flex-col overflow-hidden rounded-lg bg-surface shadow-md dark:border dark:border-border"
    >
      {ticket === null ? (
        <TicketLoadState model={model} />
      ) : (
        <>
          <header className="flex flex-col gap-3 px-6 pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-heading-sm font-semibold">{ticket.title}</h2>
                <p className="text-small text-fg-secondary tabular-nums">
                  {authorLine(ticket, now)}
                </p>
              </div>
              {model.isOpen ? (
                <Button
                  variant="secondary"
                  icon={
                    <CheckCircleIcon
                      size={ICON_SIZE.MEDIUM}
                      weight={ICON_WEIGHT}
                      aria-hidden="true"
                    />
                  }
                  onClick={model.close.ask}
                >
                  {DIALOG_TEXTS.CLOSE}
                </Button>
              ) : null}
              {ticket.closedAt === null ? null : <ClosedMark />}
            </div>
            {ticket.order === null ? null : (
              <TicketOrderCard order={ticket.order} details={model.order} />
            )}
          </header>
          <div className="flex min-h-0 flex-1 flex-col border-t border-border">
            <SupportLog
              thread={model.thread}
              label={DIALOG_TEXTS.MESSAGES}
              authorOf={(message) => message.authorName}
            />
          </div>
          <div className="shrink-0 border-t border-border">
            <TicketFooter model={model} />
          </div>
          <CloseTicketDialog model={model} />
        </>
      )}
    </section>
  );
}
