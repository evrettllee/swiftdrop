import type { ROLE } from '../../../common/enums/role.enum';

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

export type ChatHistory = ChatHistoryPage & {
  // Messages to the current user they have not read yet.
  unreadCount: number;
  canSend: boolean;
};
