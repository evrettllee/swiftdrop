import type { ReactNode } from 'react';
import type { ChatSenderRole } from '@/shared/api';
import { ActiveChatContext } from '../model/active-chat-context';
import { useOrderChat } from '../model/useOrderChat';

type ActiveOrderChatProviderProps = {
  orderId: number | null;
  ownRole: ChatSenderRole;
  reloadToken: number;
  children: ReactNode;
};

export function ActiveOrderChatProvider({
  orderId,
  ownRole,
  reloadToken,
  children,
}: ActiveOrderChatProviderProps) {
  const chat = useOrderChat(orderId, ownRole, reloadToken);

  return <ActiveChatContext value={chat}>{children}</ActiveChatContext>;
}
