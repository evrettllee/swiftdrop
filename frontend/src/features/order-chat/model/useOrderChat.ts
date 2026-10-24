import { useCallback, useEffect, useState } from 'react';
import { type ChatMessage, type ChatSenderRole, getChatHistory } from '@/shared/api';
import { onOrderEvent, SOCKET_EVENTS } from '@/shared/realtime';
import {
  type ChatState,
  EMPTY_CHAT,
  withLatestPage,
  withMessage,
  withRead,
  withReadResult,
} from './chat-store';

type StoredChat = ChatState & { orderId: number | null };
type ChatUpdate = (change: (state: ChatState) => ChatState) => void;

const NO_CHAT: StoredChat = { ...EMPTY_CHAT, orderId: null };

// The newest page of the history, again each time `reloadToken` grows. A failed load keeps what is
// shown; the next one asks again.
function useLatestPage(orderId: number | null, reloadToken: number, update: ChatUpdate): void {
  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getChatHistory(orderId, {}, { signal: controller.signal }).then(
      (page) => {
        if (!controller.signal.aborted) {
          update((state) => withLatestPage(state, page));
        }
      },
      () => undefined,
    );

    return () => controller.abort();
  }, [orderId, reloadToken, update]);
}

// message:new and message:read of the order; the events of other orders are not its business.
function useChatEvents(orderId: number | null, ownRole: ChatSenderRole, update: ChatUpdate): void {
  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    const unsubscribers = [
      onOrderEvent(SOCKET_EVENTS.MESSAGE_NEW, (event) => {
        if (event.orderId === orderId) {
          update((state) => withMessage(state, event.message, ownRole));
        }
      }),
      onOrderEvent(SOCKET_EVENTS.MESSAGE_READ, (event) => {
        if (event.orderId === orderId) {
          update((state) => withRead(state, event.readerRole, event.upToMessageId, ownRole));
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [orderId, ownRole, update]);
}

// The chat of the order the user follows, kept in step with its room: the newest page of the
// history when the order is opened and each time `reloadToken` grows (the room was joined again
// after a lost connection), every message of the order in between. The user writes as `ownRole`.
// Null keeps no chat.
export function useOrderChat(orderId: number | null, ownRole: ChatSenderRole, reloadToken: number) {
  const [stored, setStored] = useState<StoredChat>(NO_CHAT);
  // Every change goes to the chat of this order only: an answer for the previous order is dropped.
  const update = useCallback<ChatUpdate>(
    (change) =>
      setStored((current) =>
        orderId === null
          ? NO_CHAT
          : { ...change(current.orderId === orderId ? current : EMPTY_CHAT), orderId },
      ),
    [orderId],
  );

  useLatestPage(orderId, reloadToken, update);
  useChatEvents(orderId, ownRole, update);

  const chat = stored.orderId === orderId ? stored : NO_CHAT;

  return {
    messages: chat.messages,
    unreadCount: chat.unreadCount,
    canSend: chat.canSend,
    hasOlder: chat.nextBeforeId !== null,
    isLoaded: chat.isLoaded,
    // The answer to a message sent from this tab: kept in the same place as message:new.
    addSent: (message: ChatMessage) => update((state) => withMessage(state, message, ownRole)),
    // The answer to marking read from this tab.
    applyRead: (upToMessageId: number, unreadCount: number) =>
      update((state) => withReadResult(state, upToMessageId, unreadCount, ownRole)),
  };
}

export type OrderChat = ReturnType<typeof useOrderChat>;
