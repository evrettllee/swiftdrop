import { useCallback, useEffect, useState } from 'react';
import { onTypedSocketEvent, SOCKET_EVENTS, SUPPORT_READ_BY } from '@/shared/realtime';
import {
  getSupportMessages,
  SUPPORT_SIDE,
  type SupportMessage,
  type SupportSide,
} from '@/shared/support-api';
import { markOwnMessagesRead, mergeMessages } from '../lib/messages';

type Thread = {
  ticketId: number;
  items: SupportMessage[];
  nextCursor: string | null;
  isLoaded: boolean;
  isLoadingOlder: boolean;
};

function emptyThread(ticketId: number): Thread {
  return { ticketId, items: [], nextCursor: null, isLoaded: false, isLoadingOlder: false };
}

type ThreadUpdate = (change: (thread: Thread) => Thread) => void;

const READER_OF_OWN: Record<SupportSide, string> = {
  [SUPPORT_SIDE.STAFF]: SUPPORT_READ_BY.AUTHOR,
  [SUPPORT_SIDE.AUTHOR]: SUPPORT_READ_BY.STAFF,
};

function useThreadEvents(side: SupportSide, ticketId: number, update: ThreadUpdate) {
  useEffect(() => {
    const stopMessages = onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_MESSAGE, (payload) => {
      if (payload.ticketId === ticketId) {
        update((thread) => ({ ...thread, items: mergeMessages(thread.items, [payload.message]) }));
      }
    });
    const stopRead = onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_READ, (payload) => {
      if (payload.ticketId === ticketId && payload.by === READER_OF_OWN[side]) {
        update((thread) => ({ ...thread, items: markOwnMessagesRead(thread.items, side) }));
      }
    });

    return () => {
      stopMessages();
      stopRead();
    };
  }, [side, ticketId, update]);
}

function useFirstPage(side: SupportSide, ticketId: number, rejoins: number, update: ThreadUpdate) {
  useEffect(() => {
    const controller = new AbortController();

    getSupportMessages(side, ticketId, null, { signal: controller.signal }).then(
      (page) =>
        update((value) => ({
          ...value,
          items: mergeMessages(value.items, page.items),
          nextCursor: value.isLoaded ? value.nextCursor : page.nextCursor,
          isLoaded: true,
        })),
      () => {
        if (!controller.signal.aborted) {
          update((value) => ({ ...value, isLoaded: true }));
        }
      },
    );

    return () => controller.abort();
  }, [side, ticketId, rejoins, update]);
}

export function useSupportThread(side: SupportSide, ticketId: number, joins: number) {
  const [thread, setThread] = useState<Thread>(() => emptyThread(ticketId));
  const current = thread.ticketId === ticketId ? thread : emptyThread(ticketId);
  const rejoins = Math.max(joins - 1, 0);

  const update = useCallback(
    (change: (value: Thread) => Thread) =>
      setThread((previous) =>
        change(previous.ticketId === ticketId ? previous : emptyThread(ticketId)),
      ),
    [ticketId],
  );

  useFirstPage(side, ticketId, rejoins, update);
  useThreadEvents(side, ticketId, update);

  const loadOlder = useCallback(async () => {
    if (current.nextCursor === null || current.isLoadingOlder) {
      return;
    }

    update((value) => ({ ...value, isLoadingOlder: true }));

    try {
      const page = await getSupportMessages(side, ticketId, current.nextCursor);
      update((value) => ({
        ...value,
        items: mergeMessages(value.items, page.items),
        nextCursor: page.nextCursor,
        isLoadingOlder: false,
      }));
    } catch {
      update((value) => ({ ...value, isLoadingOlder: false }));
    }
  }, [side, ticketId, current.nextCursor, current.isLoadingOlder, update]);

  const add = useCallback(
    (message: SupportMessage) =>
      update((value) => ({ ...value, items: mergeMessages(value.items, [message]) })),
    [update],
  );

  return {
    side,
    messages: current.items,
    isLoaded: current.isLoaded,
    hasOlder: current.nextCursor !== null,
    isLoadingOlder: current.isLoadingOlder,
    loadOlder,
    add,
  };
}

export type SupportThread = ReturnType<typeof useSupportThread>;
