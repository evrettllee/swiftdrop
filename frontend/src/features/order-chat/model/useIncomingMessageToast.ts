import { useEffect, useEffectEvent, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { ChatMessage, ChatSenderRole } from '@/shared/api';
import { DOM_EVENT } from '@/shared/config';
import { armSound, playBeep } from '@/shared/lib/sound';
import { onOrderEvent, SOCKET_EVENTS } from '@/shared/realtime';
import { CHAT_SEARCH_PARAM, CHAT_SEARCH_PARAM_OPEN } from '@/shared/routes';
import { hideToast, showToast } from '@/shared/ui/toast';
import { CHAT_TEXTS } from '../config/texts';
import { decideIncomingToast, INCOMING_TOAST } from '../lib/incoming-toast';
import { useChatParam } from './useChatParam';

type IncomingMessageToastOptions = {
  orderId: number | null;
  ownRole: ChatSenderRole;
  senderName: string;
  chatPath: string;
};

function toastKey(orderId: number): string {
  return `chat:${orderId}`;
}

function useChatPlace(chatPath: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isChatOpen, openChat } = useChatParam();
  return {
    isChatOpen: location.pathname === chatPath && isChatOpen,
    reply: () => {
      if (window.location.pathname === chatPath) {
        openChat();
      } else {
        void navigate(`${chatPath}?${CHAT_SEARCH_PARAM}=${CHAT_SEARCH_PARAM_OPEN}`);
      }
    },
  };
}

function useMessageEvents(orderId: number | null, onMessage: (message: ChatMessage) => void): void {
  const handleMessage = useEffectEvent(onMessage);

  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    return onOrderEvent(SOCKET_EVENTS.MESSAGE_NEW, (event) => {
      if (event.orderId === orderId) {
        handleMessage(event.message);
      }
    });
  }, [orderId]);
}

function useReturnToPage(orderId: number | null, onReturn: () => void): void {
  const handleReturn = useEffectEvent(onReturn);

  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    function handleVisibility(): void {
      if (!document.hidden) {
        handleReturn();
      }
    }

    document.addEventListener(DOM_EVENT.VISIBILITY_CHANGE, handleVisibility);

    return () => {
      document.removeEventListener(DOM_EVENT.VISIBILITY_CHANGE, handleVisibility);
      hideToast(toastKey(orderId));
    };
  }, [orderId]);
}

export function useIncomingMessageToast({
  orderId,
  ownRole,
  senderName,
  chatPath,
}: IncomingMessageToastOptions): void {
  const { isChatOpen, reply } = useChatPlace(chatPath);
  const pending = useRef<ChatMessage | null>(null);

  function present(message: ChatMessage): void {
    const source = { senderRole: message.senderRole, ownRole, isChatOpen };
    const decision = decideIncomingToast({ ...source, isPageHidden: document.hidden });

    if (decision === INCOMING_TOAST.DEFER) {
      pending.current = message;
    }

    if (decision === INCOMING_TOAST.SHOW && orderId !== null) {
      const key = toastKey(orderId);
      const onAction = () => {
        hideToast(key);
        reply();
      };
      showToast({
        key,
        variant: 'chat',
        title: senderName,
        text: message.content,
        action: { label: CHAT_TEXTS.REPLY, onAction },
      });
      void playBeep();
    }
  }

  useEffect(() => armSound(), []);
  useMessageEvents(orderId, present);
  useReturnToPage(orderId, () => {
    const message = pending.current;
    pending.current = null;

    if (message !== null) {
      present(message);
    }
  });

  useEffect(() => {
    if (orderId !== null && isChatOpen) {
      hideToast(toastKey(orderId));
    }
  }, [orderId, isChatOpen]);
}
