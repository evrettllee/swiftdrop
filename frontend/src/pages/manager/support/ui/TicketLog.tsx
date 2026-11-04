import { useEffect, useState } from 'react';
import type { SupportMessage } from '@/shared/support-api';
import { ChatBubble, ChatDaySection, groupByDay, useChatScroll } from '@/shared/ui/chat';
import { Spinner } from '@/shared/ui/spinner';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import type { TicketModel } from '../model/useTicket';

const createdAtOf = (message: SupportMessage) => message.createdAt;

function useIncomingAnnouncement(messages: readonly SupportMessage[], isLoaded: boolean): string {
  const lastIncoming = messages.findLast((message) => !message.fromStaff) ?? null;
  const [baselineId, setBaselineId] = useState<number | null>(null);

  if (isLoaded && baselineId === null) {
    setBaselineId(lastIncoming?.id ?? 0);
  }

  return baselineId !== null && lastIncoming !== null && lastIncoming.id > baselineId
    ? DIALOG_TEXTS.incoming(lastIncoming.text)
    : '';
}

type TicketLogProps = {
  thread: TicketModel['thread'];
  showAuthors: boolean;
};

export function TicketLog({ thread, showAuthors }: TicketLogProps) {
  const { messages, isLoaded, isLoadingOlder } = thread;
  const last = messages.at(-1) ?? null;
  const { scroller, handleScroll, requestOlder } = useChatScroll({
    firstKey: messages[0]?.id ?? null,
    lastKey: last?.id ?? null,
    isLastOwn: last?.fromStaff === true,
    isLoaded,
    hasOlder: thread.hasOlder,
    isLoadingOlder,
    loadOlder: thread.loadOlder,
  });
  const [nowMs] = useState(() => Date.now());
  const announcement = useIncomingAnnouncement(messages, isLoaded);
  const days = groupByDay(messages, createdAtOf, nowMs);

  useEffect(() => {
    const element = scroller.current;

    if (isLoaded && element !== null && element.scrollHeight <= element.clientHeight) {
      requestOlder();
    }
  });

  return (
    <>
      <div
        ref={scroller}
        role="log"
        tabIndex={0}
        aria-live="off"
        aria-label={DIALOG_TEXTS.MESSAGES}
        aria-busy={!isLoaded || isLoadingOlder}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-4"
      >
        {isLoadingOlder || !isLoaded ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : null}
        {isLoaded && days.length === 0 ? (
          <p className="grid flex-1 place-items-center text-center text-small text-fg-secondary">
            {DIALOG_TEXTS.EMPTY}
          </p>
        ) : null}
        {days.map((day) => (
          <ChatDaySection key={day.key} label={day.label}>
            {day.items.map((message) => (
              <ChatBubble
                key={message.id}
                text={message.text}
                sentAt={message.createdAt}
                isOwn={message.fromStaff}
                isRead={message.isRead}
                author={showAuthors ? message.authorName : undefined}
              />
            ))}
          </ChatDaySection>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
