import { useEffect, useState } from 'react';
import { Spinner } from '@/shared/ui/spinner';
import { CHAT_TEXTS } from '../config/texts';
import { groupMessagesByDay } from '../lib/day-groups';
import { useChat } from './chat-context';
import { ChatBubble } from './ChatBubble';
import { useChatScroll } from './useChatScroll';

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
  const { scroller, handleScroll, requestOlder } = useChatScroll(chat);
  const [nowMs] = useState(() => Date.now());
  const announcement = useIncomingAnnouncement();
  const days = groupMessagesByDay(chat.messages, nowMs);

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
          <section key={day.key} aria-label={day.label} className="flex flex-col gap-2">
            <h3 className="self-center text-caption text-fg-secondary">{day.label}</h3>
            {day.messages.map((message) => (
              <ChatBubble
                key={message.messageId}
                message={message}
                isOwn={message.senderRole === chat.ownRole}
              />
            ))}
          </section>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
