import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { CHAT_SEARCH_PARAM, CHAT_SEARCH_PARAM_OPEN, isChatOpenIn } from '@/shared/routes';

type ChatHistoryState = { isChatOpenedHere?: boolean } | null;

function withoutChat(current: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete(CHAT_SEARCH_PARAM);

  return next;
}

export function useChatParamCleanup(hasChat: boolean): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const isChatOpen = isChatOpenIn(searchParams);

  useEffect(() => {
    if (!hasChat && isChatOpen) {
      setSearchParams(withoutChat, { replace: true });
    }
  }, [hasChat, isChatOpen, setSearchParams]);
}

export function useChatParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isOpenedHere = (location.state as ChatHistoryState)?.isChatOpenedHere === true;

  const openChat = useCallback(
    () =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(CHAT_SEARCH_PARAM, CHAT_SEARCH_PARAM_OPEN);

          return next;
        },
        { state: { isChatOpenedHere: true } },
      ),
    [setSearchParams],
  );

  const closeChat = useCallback(() => {
    if (isOpenedHere) {
      void navigate(-1);

      return;
    }

    setSearchParams(withoutChat, { replace: true });
  }, [isOpenedHere, navigate, setSearchParams]);

  return { isChatOpen: isChatOpenIn(searchParams), openChat, closeChat };
}
