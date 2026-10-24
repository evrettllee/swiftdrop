import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { CHAT_PARAM, CHAT_PARAM_OPEN } from '../config/chat';

export function useChatParam() {
  const [searchParams, setSearchParams] = useSearchParams();

  const openChat = useCallback(
    () =>
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set(CHAT_PARAM, CHAT_PARAM_OPEN);

        return next;
      }),
    [setSearchParams],
  );

  return { isChatOpen: searchParams.get(CHAT_PARAM) === CHAT_PARAM_OPEN, openChat };
}
