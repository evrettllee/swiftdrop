import type { ROLE } from '@/common/enums/role.enum';

export type ChatSenderRole = typeof ROLE.CLIENT | typeof ROLE.COURIER;

// A message as it is read from the database, newest first.
export type ChatMessageRow = {
  messageId: number;
  senderId: number;
  content: string | null;
  sentAt: Date;
  isRead: boolean;
};

// A message for either side; the user ids stay on the server.
export type ChatMessage = {
  messageId: number;
  senderRole: ChatSenderRole;
  content: string;
  sentAt: string;
  isRead: boolean;
};

export type ChatHistoryPage = {
  // Oldest first, as the chat shows them.
  items: ChatMessage[];
  // The id to ask the next, older page before; null on the oldest page.
  nextBeforeId: number | null;
};

// The answer to a sent message.
export type SentChatMessage = { message: ChatMessage };

// message:new in the order room: both sides and every tab of the sender get it; a tab drops a
// message it already has by its id.
export type MessageNewEvent = { orderId: number; message: ChatMessage };

// The answer to marking messages read: how many changed now and how many are still unread.
export type ChatReadResult = { readCount: number; unreadCount: number };

// message:read in the order room: the reader read every message to them up to this id, the
// largest one marked now.
export type MessageReadEvent = {
  orderId: number;
  readerRole: ChatSenderRole;
  upToMessageId: number;
};

export type ChatHistory = ChatHistoryPage & {
  // Messages to the current user they have not read yet.
  unreadCount: number;
  canSend: boolean;
};
