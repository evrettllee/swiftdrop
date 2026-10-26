import { z } from 'zod';
import { ApiError, http, type HttpOptions } from '../http';
import { HTTP_STATUS } from '../request-config';
import { dateSchema, ORDERS_API_PATHS } from './order';

// The chat of an order lives under the order; the client of the order and its courier read it.
export const CHAT_API_PATHS = {
  messages: (orderId: number) => `${ORDERS_API_PATHS.ORDERS}/${orderId}/messages`,
  read: (orderId: number) => `${ORDERS_API_PATHS.ORDERS}/${orderId}/messages/read`,
} as const;

const CHAT_HISTORY_PARAM = {
  BEFORE_ID: 'beforeId',
  LIMIT: 'limit',
} as const;

// Messages of one page of the history, from the newest back: the default of the backend (it takes
// 1 to 50).
export const CHAT_PAGE_SIZE = 30;

// Who wrote a message: must match the roles of the backend.
export const CHAT_SENDER_ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
} as const;

export type ChatSenderRole = (typeof CHAT_SENDER_ROLE)[keyof typeof CHAT_SENDER_ROLE];

// One message (the ChatMessage of the backend), as GET, POST and message:new give it. isRead: the
// receiver has read it.
export const chatMessageSchema = z.object({
  messageId: z.number(),
  senderRole: z.enum(CHAT_SENDER_ROLE),
  content: z.string(),
  sentAt: dateSchema,
  isRead: z.boolean(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Response of GET /api/orders/:orderId/messages: one page, oldest first; nextBeforeId asks for the
// older page and is null on the oldest one. unreadCount: messages to the user not read yet.
// canSend: the order is with its courier, so the chat takes new messages.
export const chatHistorySchema = z.object({
  items: z.array(chatMessageSchema),
  nextBeforeId: z.number().nullable(),
  unreadCount: z.number(),
  canSend: z.boolean(),
});

export type ChatHistory = z.infer<typeof chatHistorySchema>;

// Response of POST /api/orders/:orderId/messages.
const sentChatMessageSchema = z.object({ message: chatMessageSchema });

// Response of POST /api/orders/:orderId/messages/read: how many were marked now and how many
// messages to the user are still unread.
export const chatReadResultSchema = z.object({
  readCount: z.number(),
  unreadCount: z.number(),
});

export type ChatReadResult = z.infer<typeof chatReadResultSchema>;

type ChatHistoryPage = {
  // The id of the oldest message shown: the page before it. Without it, the newest page.
  beforeId?: number;
  limit?: number;
};

export async function getChatHistory(
  orderId: number,
  { beforeId, limit = CHAT_PAGE_SIZE }: ChatHistoryPage = {},
  options: HttpOptions = {},
): Promise<ChatHistory> {
  const query = new URLSearchParams({ [CHAT_HISTORY_PARAM.LIMIT]: String(limit) });

  if (beforeId !== undefined) {
    query.set(CHAT_HISTORY_PARAM.BEFORE_ID, String(beforeId));
  }

  return chatHistorySchema.parse(
    await http.get(`${CHAT_API_PATHS.messages(orderId)}?${query.toString()}`, options),
  );
}

// The backend trims the message and answers with the saved one. The same message comes to every
// open tab with message:new, so the caller keeps one copy of it by its id.
export async function sendChatMessage(orderId: number, content: string): Promise<ChatMessage> {
  const { message } = sentChatMessageSchema.parse(
    await http.post(CHAT_API_PATHS.messages(orderId), { content }),
  );

  return message;
}

// Marks the messages to the user read up to the id, in any status of the order; marking the same
// messages again changes nothing.
export async function markChatRead(
  orderId: number,
  upToMessageId: number,
): Promise<ChatReadResult> {
  return chatReadResultSchema.parse(
    await http.post(CHAT_API_PATHS.read(orderId), { upToMessageId }),
  );
}

// Why the backend refused a message, with its own text for the user.
export const CHAT_SEND_FAILURE = {
  // 409: the order is over and the chat is closed, or the order is being changed right now; the
  // history tells which (canSend).
  CONFLICT: 'conflict',
  // 429: more than 20 messages in a minute.
  TOO_MANY: 'too_many',
} as const;

export type ChatSendFailureKind = (typeof CHAT_SEND_FAILURE)[keyof typeof CHAT_SEND_FAILURE];

export type ChatSendFailure = { kind: ChatSendFailureKind; message: string };

const chatSendFailureSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal(HTTP_STATUS.CONFLICT), message: z.string() }),
  z.object({ status: z.literal(HTTP_STATUS.TOO_MANY_REQUESTS), message: z.string() }),
]);

const FAILURE_KIND = {
  [HTTP_STATUS.CONFLICT]: CHAT_SEND_FAILURE.CONFLICT,
  [HTTP_STATUS.TOO_MANY_REQUESTS]: CHAT_SEND_FAILURE.TOO_MANY,
} as const;

// A failed send as a 409 or a 429 with the text of the backend; null for any other failure (the
// network, the server, a refused body), which the caller tells with its own text.
export function toChatSendFailure(error: unknown): ChatSendFailure | null {
  const parsed =
    error instanceof ApiError
      ? chatSendFailureSchema.safeParse({ status: error.status, message: error.message })
      : null;

  return parsed?.success === true
    ? { kind: FAILURE_KIND[parsed.data.status], message: parsed.data.message }
    : null;
}
