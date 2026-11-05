import { ArrowLeftIcon, CheckCircleIcon, PhoneIcon } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { SupportLog } from '@/features/support-thread';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useBodyScrollLock } from '@/shared/lib/dom';
import { buildTelHref } from '@/shared/lib/format';
import { IconButton } from '@/shared/ui/icon-button';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import { ROLE_NAMES } from '../config/texts';
import type { TicketModel } from '../model/useTicket';
import { CloseTicketDialog } from './CloseTicketDialog';
import { ClosedMark, TicketLoadState } from './TicketPanel';
import { TicketFooter } from './TicketFooter';
import { TicketOrderCard } from './TicketOrderCard';

const ICON = { size: ICON_SIZE.MEDIUM, weight: ICON_WEIGHT, 'aria-hidden': true } as const;

type TicketScreenProps = {
  model: TicketModel;
  onBack: () => void;
};

const noAuthor = () => undefined;

export function TicketScreen({ model, onBack }: TicketScreenProps) {
  const screen = useRef<HTMLElement>(null);
  const { ticket } = model;
  const phone = ticket?.author.phone ?? null;
  const telHref = phone === null ? null : buildTelHref(phone);
  const isReady = ticket !== null;

  useBodyScrollLock(true);

  useEffect(() => {
    screen.current?.querySelector('h1')?.focus();
  }, [isReady]);

  return (
    <section
      ref={screen}
      aria-label={DIALOG_TEXTS.LABEL}
      className="fixed inset-0 z-40 flex flex-col bg-page"
    >
      <header className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
        <IconButton aria-label={DIALOG_TEXTS.BACK} onClick={onBack}>
          <ArrowLeftIcon {...ICON} />
        </IconButton>
        <div className="flex min-w-0 grow flex-col">
          <h1 tabIndex={-1} className="truncate font-semibold outline-none">
            {ticket?.title ?? ''}
          </h1>
          {ticket === null ? null : (
            <p className="truncate text-small text-fg-secondary">
              {`${ticket.author.name}, ${ROLE_NAMES[ticket.author.role]}`}
            </p>
          )}
        </div>
        {telHref === null ? null : (
          <a
            href={telHref}
            aria-label={DIALOG_TEXTS.CALL}
            className="grid size-11 place-items-center rounded-md text-accent hover:bg-selected"
          >
            <PhoneIcon {...ICON} />
          </a>
        )}
        {model.isOpen ? (
          <IconButton
            aria-label={DIALOG_TEXTS.CLOSE}
            onClick={model.close.ask}
            className="text-accent"
          >
            <CheckCircleIcon {...ICON} />
          </IconButton>
        ) : null}
        {ticket === null || ticket.closedAt === null ? null : <ClosedMark />}
      </header>
      {ticket === null ? (
        <TicketLoadState model={model} />
      ) : (
        <>
          {ticket.order === null ? null : (
            <div className="shrink-0 px-4 pt-4">
              <TicketOrderCard order={ticket.order} details={model.order} />
            </div>
          )}
          <SupportLog thread={model.thread} label={DIALOG_TEXTS.MESSAGES} authorOf={noAuthor} />
          <div className="shrink-0 border-t border-border">
            <TicketFooter model={model} />
          </div>
          <CloseTicketDialog model={model} />
        </>
      )}
    </section>
  );
}
