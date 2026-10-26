import { useEffect, useId, useMemo, useRef } from 'react';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { useChatParam } from './useChatParam';

export function useOrderChatView(hasChat: boolean) {
  const { isChatOpen, openChat, closeChat } = useChatParam();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const chatId = useId();
  const isOpen = hasChat && isChatOpen;

  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      chatButtonRef.current?.focus();
    }

    wasOpen.current = isOpen;
  }, [isOpen]);

  return useMemo(
    () => ({
      chatId,
      chatButtonRef,
      isDrawerOpen: isOpen && isDesktop,
      isScreenOpen: isOpen && !isDesktop,
      isOpen,
      openChat,
      closeChat,
    }),
    [chatId, isOpen, isDesktop, openChat, closeChat],
  );
}

export type OrderChatView = ReturnType<typeof useOrderChatView>;
