import { useLayoutEffect, useRef } from 'react';

const NEAR_EDGE_PX = 64;

export type ChatScrollSource = {
  firstKey: number | null;
  lastKey: number | null;
  isLastOwn: boolean;
  isLoaded: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => Promise<void>;
};

export function useChatScroll({
  firstKey,
  lastKey,
  isLastOwn,
  isLoaded,
  hasOlder,
  isLoadingOlder,
  loadOlder,
}: ChatScrollSource) {
  const scroller = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const fromBottom = useRef<number | null>(null);

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
  }, [firstKey]);

  useLayoutEffect(() => {
    const element = scroller.current;

    if (element !== null && isLoaded && (isAtBottom.current || isLastOwn)) {
      element.scrollTop = element.scrollHeight;
    }
  }, [isLoaded, lastKey, isLastOwn]);

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
