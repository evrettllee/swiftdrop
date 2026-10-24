import { useLayoutEffect, useRef } from 'react';
import type { ChatMessage } from '@/shared/api';

const NEAR_EDGE_PX = 64;

type ChatScrollSource = {
  messages: readonly ChatMessage[];
  ownRole: ChatMessage['senderRole'];
  isLoaded: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => Promise<void>;
};

export function useChatScroll({
  messages,
  ownRole,
  isLoaded,
  hasOlder,
  isLoadingOlder,
  loadOlder,
}: ChatScrollSource) {
  const scroller = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const fromBottom = useRef<number | null>(null);
  const firstId = messages[0]?.messageId ?? null;
  const last = messages.at(-1) ?? null;

  function requestOlder(): void {
    const element = scroller.current;

    if (element !== null && hasOlder && !isLoadingOlder) {
      fromBottom.current = element.scrollHeight - element.scrollTop;
      void loadOlder();
    }
  }

  useLayoutEffect(() => {
    const element = scroller.current;

    if (element !== null && fromBottom.current !== null) {
      element.scrollTop = element.scrollHeight - fromBottom.current;
      fromBottom.current = null;
    }
  }, [firstId]);

  useLayoutEffect(() => {
    const element = scroller.current;

    if (element !== null && isLoaded && (isAtBottom.current || last?.senderRole === ownRole)) {
      element.scrollTop = element.scrollHeight;
    }
  }, [isLoaded, last?.messageId, last?.senderRole, ownRole]);

  function handleScroll(): void {
    const element = scroller.current;

    if (element === null) {
      return;
    }

    isAtBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_EDGE_PX;

    if (element.scrollTop < NEAR_EDGE_PX) {
      requestOlder();
    }
  }

  return { scroller, handleScroll, requestOlder };
}
