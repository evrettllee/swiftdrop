import { useCallback, useEffect, useState } from 'react';
import { onTypedSocketEvent, SOCKET_EVENTS, SUPPORT_READ_BY } from '@/shared/realtime';
import { getSupportMessages, type SupportMessage } from '@/shared/support-api';
import { markStaffMessagesRead, mergeMessages } from '../lib/messages';

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

function useThreadEvents(ticketId: number, update: ThreadUpdate) {
  useEffect(() => {
    const stopMessages = onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_MESSAGE, (payload) => {
      if (payload.ticketId === ticketId) {
        update((thread) => ({ ...thread, items: mergeMessages(thread.items, [payload.message]) }));
      }
    });
    const stopRead = onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_READ, (payload) => {
      if (payload.ticketId === ticketId && payload.by === SUPPORT_READ_BY.AUTHOR) {
        update((thread) => ({ ...thread, items: markStaffMessagesRead(thread.items) }));
      }
    });

    return () => {
      stopMessages();
      stopRead();
    };
  }, [ticketId, update]);
}

function useFirstPage(ticketId: number, rejoins: number, update: ThreadUpdate): void {
  useEffect(() => {
    const controller = new AbortController();

    getSupportMessages(ticketId, null, { signal: controller.signal }).then(
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
  }, [ticketId, rejoins, update]);
}

export function useTicketMessages(ticketId: number, joins: number) {
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

  useFirstPage(ticketId, rejoins, update);
  useThreadEvents(ticketId, update);

  const loadOlder = useCallback(async () => {
    if (current.nextCursor === null || current.isLoadingOlder) {
      return;
    }

    update((value) => ({ ...value, isLoadingOlder: true }));

    try {
      const page = await getSupportMessages(ticketId, current.nextCursor);
      update((value) => ({
        ...value,
        items: mergeMessages(value.items, page.items),
        nextCursor: page.nextCursor,
        isLoadingOlder: false,
      }));
    } catch {
      update((value) => ({ ...value, isLoadingOlder: false }));
    }
  }, [ticketId, current.nextCursor, current.isLoadingOlder, update]);

  const add = useCallback(
    (message: SupportMessage) =>
      update((value) => ({ ...value, items: mergeMessages(value.items, [message]) })),
    [update],
  );

  return {
    messages: current.items,
    isLoaded: current.isLoaded,
    hasOlder: current.nextCursor !== null,
    isLoadingOlder: current.isLoadingOlder,
    loadOlder,
    add,
  };
}
