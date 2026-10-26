import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ChatSenderRole, getChatHistory } from '@/shared/api';
import { onOrderEvent, SOCKET_EVENTS } from '@/shared/realtime';
import { type ChatState, EMPTY_CHAT, withLatestPage, withMessage, withRead } from './chat-store';
import { useChatReadMarking, useChatSending, useOlderPages } from './useChatActions';

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

function useStoredChat(orderId: number | null) {
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

  return { chat: stored.orderId === orderId ? stored : NO_CHAT, update };
}

// The chat of the order the user follows, kept in step with its room: the newest page of the
// history when the order is opened and each time `reloadToken` grows (the room was joined again
// after a lost connection), every message of the order in between. The user writes as `ownRole`.
// Null keeps no chat.
export function useOrderChat(orderId: number | null, ownRole: ChatSenderRole, reloadToken: number) {
  const { chat, update } = useStoredChat(orderId);
  const [conflicts, setConflicts] = useState(0);

  useLatestPage(orderId, reloadToken + conflicts, update);
  useChatEvents(orderId, ownRole, update);

  const older = useOlderPages(orderId, chat.nextBeforeId, update);
  const onConflict = useCallback(() => setConflicts((count) => count + 1), []);
  const sending = useChatSending(orderId, ownRole, update, onConflict);
  const markRead = useChatReadMarking(orderId, ownRole, update);
  const { messages, unreadCount, canSend, nextBeforeId, isLoaded } = chat;
  const { isLoadingOlder, loadOlder } = older;
  const { isSending, sendError, send } = sending;

  return useMemo(
    () => ({
      ownRole,
      messages,
      unreadCount,
      canSend,
      hasOlder: nextBeforeId !== null,
      isLoaded,
      isLoadingOlder,
      loadOlder,
      isSending,
      sendError,
      send,
      markRead,
    }),
    [
      ownRole,
      messages,
      unreadCount,
      canSend,
      nextBeforeId,
      isLoaded,
      isLoadingOlder,
      loadOlder,
      isSending,
      sendError,
      send,
      markRead,
    ],
  );
}

export type OrderChat = ReturnType<typeof useOrderChat>;
