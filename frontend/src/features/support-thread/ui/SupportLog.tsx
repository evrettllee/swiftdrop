import { type ReactNode, useEffect, useState } from 'react';
import type { SupportMessage } from '@/shared/support-api';
import { ChatBubble, ChatDaySection, groupByDay, useChatScroll } from '@/shared/ui/chat';
import { Spinner } from '@/shared/ui/spinner';
import { SUPPORT_THREAD_TEXTS } from '../config/texts';
import { isOwnMessage } from '../lib/messages';
import type { SupportThread } from '../model/useSupportThread';

const createdAtOf = (message: SupportMessage) => message.createdAt;

function useIncomingAnnouncement(thread: SupportThread): string {
  const lastIncoming =
    thread.messages.findLast((message) => !isOwnMessage(message, thread.side)) ?? null;
  const [baselineId, setBaselineId] = useState<number | null>(null);

  if (thread.isLoaded && baselineId === null) {
    setBaselineId(lastIncoming?.id ?? 0);
  }

  return baselineId !== null && lastIncoming !== null && lastIncoming.id > baselineId
    ? SUPPORT_THREAD_TEXTS.incoming(lastIncoming.text)
    : '';
}

type SupportLogProps = {
  thread: SupportThread;
  label: string;
  authorOf: (message: SupportMessage, isOwn: boolean) => string | undefined;
  lead?: ReactNode;
};

export function SupportLog({ thread, label, authorOf, lead }: SupportLogProps) {
  const { messages, isLoaded, isLoadingOlder, side } = thread;
  const last = messages.at(-1) ?? null;
  const { scroller, handleScroll, requestOlder } = useChatScroll({
    firstKey: messages[0]?.id ?? null,
    lastKey: last?.id ?? null,
    isLastOwn: last !== null && isOwnMessage(last, side),
    isLoaded,
    hasOlder: thread.hasOlder,
    isLoadingOlder,
    loadOlder: thread.loadOlder,
  });
  const [nowMs] = useState(() => Date.now());
  const announcement = useIncomingAnnouncement(thread);
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
        aria-label={label}
        aria-busy={!isLoaded || isLoadingOlder}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-4"
      >
        {lead}
        {isLoadingOlder || !isLoaded ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : null}
        {isLoaded && days.length === 0 ? (
          <p className="grid flex-1 place-items-center text-center text-small text-fg-secondary">
            {SUPPORT_THREAD_TEXTS.EMPTY}
          </p>
        ) : null}
        {days.map((day) => (
          <ChatDaySection key={day.key} label={day.label}>
            {day.items.map((message) => {
              const isOwn = isOwnMessage(message, side);

              return (
                <ChatBubble
                  key={message.id}
                  text={message.text}
                  sentAt={message.createdAt}
                  isOwn={isOwn}
                  isRead={message.isRead}
                  author={authorOf(message, isOwn)}
                />
              );
            })}
          </ChatDaySection>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
