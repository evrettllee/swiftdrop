import { useEffect, useState } from 'react';
import type { ChatMessage } from '@/shared/api';
import { ChatBubble, ChatDaySection, groupByDay, useChatScroll } from '@/shared/ui/chat';
import { Spinner } from '@/shared/ui/spinner';
import { CHAT_TEXTS } from '../config/texts';
import { useChat } from './chat-context';

const sentAtOf = (message: ChatMessage) => message.sentAt;

function useIncomingAnnouncement() {
  const { messages, ownRole, isLoaded } = useChat();
  const lastIncoming = messages.findLast((message) => message.senderRole !== ownRole) ?? null;
  const [baselineId, setBaselineId] = useState<number | null>(null);

  if (isLoaded && baselineId === null) {
    setBaselineId(lastIncoming?.messageId ?? 0);
  }

  return baselineId !== null && lastIncoming !== null && lastIncoming.messageId > baselineId
    ? CHAT_TEXTS.incoming(lastIncoming.content)
    : '';
}

export function ChatMessages() {
  const chat = useChat();
  const last = chat.messages.at(-1) ?? null;
  const { scroller, handleScroll, requestOlder } = useChatScroll({
    firstKey: chat.messages[0]?.messageId ?? null,
    lastKey: last?.messageId ?? null,
    isLastOwn: last?.senderRole === chat.ownRole,
    isLoaded: chat.isLoaded,
    hasOlder: chat.hasOlder,
    isLoadingOlder: chat.isLoadingOlder,
    loadOlder: chat.loadOlder,
  });
  const [nowMs] = useState(() => Date.now());
  const announcement = useIncomingAnnouncement();
  const days = groupByDay(chat.messages, sentAtOf, nowMs);

  useEffect(() => {
    const element = scroller.current;

    if (chat.isLoaded && element !== null && element.scrollHeight <= element.clientHeight) {
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
        aria-label={CHAT_TEXTS.MESSAGES}
        aria-busy={!chat.isLoaded || chat.isLoadingOlder}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-4"
      >
        {chat.isLoadingOlder ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : null}
        {!chat.isLoaded ? (
          <div className="grid flex-1 place-items-center">
            <Spinner />
          </div>
        ) : null}
        {chat.isLoaded && days.length === 0 ? (
          <p className="grid flex-1 place-items-center text-center text-small text-fg-secondary">
            {CHAT_TEXTS.EMPTY}
          </p>
        ) : null}
        {days.map((day) => (
          <ChatDaySection key={day.key} label={day.label}>
            {day.items.map((message) => (
              <ChatBubble
                key={message.messageId}
                text={message.content}
                sentAt={message.sentAt}
                isRead={message.isRead}
                isOwn={message.senderRole === chat.ownRole}
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
