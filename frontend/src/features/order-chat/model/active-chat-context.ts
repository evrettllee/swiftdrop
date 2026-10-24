import { createContext, use } from 'react';
import type { OrderChat } from './useOrderChat';

export const ActiveChatContext = createContext<OrderChat | null>(null);

export function useActiveOrderChat(): OrderChat {
  const chat = use(ActiveChatContext);

  if (chat === null) {
    throw new Error('useActiveOrderChat is used outside ActiveOrderChatProvider');
  }

  return chat;
}
