import { createContext, use } from 'react';
import type { OrderChat } from '../model/useOrderChat';

export const ChatContext = createContext<OrderChat | null>(null);

export function useChat(): OrderChat {
  const chat = use(ChatContext);

  if (chat === null) {
    throw new Error('Chat parts are used outside of Chat');
  }

  return chat;
}
