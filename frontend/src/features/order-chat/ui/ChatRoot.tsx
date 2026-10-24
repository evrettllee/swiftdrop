import { type ReactNode, useEffect, useEffectEvent } from 'react';
import { useDocumentVisible } from '@/shared/lib/dom';
import { getReadTargetId } from '../lib/read-target';
import type { OrderChat } from '../model/useOrderChat';
import { ChatContext } from './chat-context';

type ChatProps = {
  chat: OrderChat;
  children: ReactNode;
};

function useReadWhileShown(chat: OrderChat): void {
  const isVisible = useDocumentVisible();
  const targetId = chat.isLoaded ? getReadTargetId(chat.messages, chat.ownRole) : null;
  const markRead = useEffectEvent((upToMessageId: number) => void chat.markRead(upToMessageId));

  useEffect(() => {
    if (isVisible && targetId !== null) {
      markRead(targetId);
    }
  }, [isVisible, targetId]);
}

export function ChatRoot({ chat, children }: ChatProps) {
  useReadWhileShown(chat);

  return <ChatContext value={chat}>{children}</ChatContext>;
}

export function ChatFooter({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 flex-col border-t border-border">{children}</div>;
}
