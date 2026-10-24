import { useRef, useState } from 'react';
import {
  CHAT_SEND_FAILURE,
  type ChatSenderRole,
  getChatHistory,
  markChatRead,
  sendChatMessage,
  toChatSendFailure,
} from '@/shared/api';
import { CHAT_TEXTS } from '../config/texts';
import { type ChatState, withMessage, withOlderPage, withReadResult } from './chat-store';

type ChatUpdate = (change: (state: ChatState) => ChatState) => void;

export function useOlderPages(
  orderId: number | null,
  nextBeforeId: number | null,
  update: ChatUpdate,
) {
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const isBusy = useRef(false);

  async function loadOlder(): Promise<void> {
    if (orderId === null || nextBeforeId === null || isBusy.current) {
      return;
    }

    isBusy.current = true;
    setIsLoadingOlder(true);

    try {
      const page = await getChatHistory(orderId, { beforeId: nextBeforeId });
      update((state) => withOlderPage(state, page));
    } catch {
      return;
    } finally {
      isBusy.current = false;
      setIsLoadingOlder(false);
    }
  }

  return { isLoadingOlder, loadOlder };
}

export function useChatSending(
  orderId: number | null,
  ownRole: ChatSenderRole,
  update: ChatUpdate,
  onConflict: () => void,
) {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function send(content: string): Promise<boolean> {
    if (orderId === null || isSending) {
      return false;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const message = await sendChatMessage(orderId, content.trim());
      update((state) => withMessage(state, message, ownRole));

      return true;
    } catch (error) {
      const failure = toChatSendFailure(error);

      if (failure?.kind === CHAT_SEND_FAILURE.CONFLICT) {
        onConflict();
      }

      setSendError(failure?.message ?? CHAT_TEXTS.SEND_FAILED);

      return false;
    } finally {
      setIsSending(false);
    }
  }

  return { isSending, sendError, send };
}

export function useChatReadMarking(
  orderId: number | null,
  ownRole: ChatSenderRole,
  update: ChatUpdate,
) {
  return async function markRead(upToMessageId: number): Promise<void> {
    if (orderId === null) {
      return;
    }

    try {
      const { unreadCount } = await markChatRead(orderId, upToMessageId);
      update((state) => withReadResult(state, upToMessageId, unreadCount, ownRole));
    } catch {
      return;
    }
  };
}
