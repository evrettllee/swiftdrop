import { ChatsCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/shared/ui/empty-state';
import { MANAGER_SUPPORT_TEXTS as TEXTS } from '../config/texts';
import { TicketDialog } from './TicketDialog';

type SupportLayoutProps = {
  isDesktop: boolean;
  queue: ReactNode;
  ticketId: number | null;
  onChanged: () => void;
  onBack: () => void;
};

export function SupportLayout({
  isDesktop,
  queue,
  ticketId,
  onChanged,
  onBack,
}: SupportLayoutProps) {
  const dialog =
    ticketId === null ? null : (
      <TicketDialog
        key={ticketId}
        ticketId={ticketId}
        isDesktop={isDesktop}
        onChanged={onChanged}
        onBack={onBack}
      />
    );

  if (!isDesktop) {
    return (
      <>
        {queue}
        {dialog}
      </>
    );
  }

  return (
    <div className="grid grid-cols-[25rem_minmax(0,1fr)] gap-6">
      {queue}
      {dialog ?? (
        <div className="grid h-160 place-items-center rounded-lg bg-surface shadow-md dark:border dark:border-border">
          <EmptyState icon={ChatsCircleIcon} title={TEXTS.SELECT_TITLE} text={TEXTS.SELECT_TEXT} />
        </div>
      )}
    </div>
  );
}
