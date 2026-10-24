import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { CHAT_SEARCH_PARAM, CHAT_SEARCH_PARAM_OPEN, isChatOpenIn } from '@/shared/routes';

type ChatHistoryState = { isChatOpenedHere?: boolean } | null;

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

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(CHAT_SEARCH_PARAM);

        return next;
      },
      { replace: true },
    );
  }, [isOpenedHere, navigate, setSearchParams]);

  return { isChatOpen: isChatOpenIn(searchParams), openChat, closeChat };
}
