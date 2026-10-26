import type { Page } from '@playwright/test';
import {
  CHAT_API_PATHS,
  CHAT_PAGE_SIZE,
  type ChatSenderRole,
} from '../../src/shared/api/endpoints/chat';
import { API_BASE_PATH } from '../../src/shared/api/request-config';

const MINUTE_MS = 60_000;

export type ChatMessageBody = {
  messageId: number;
  senderRole: ChatSenderRole;
  content: string;
  sentAt: string;
  isRead: boolean;
};

export type ChatRefusal = { status: number; message: string };

export type ChatBackend = {
  ownRole: ChatSenderRole;
  messages: ChatMessageBody[];
  unreadCount: number;
  canSend: boolean;
  refusal: ChatRefusal | null;
  sent: string[];
  reads: number[];
  pages: (number | null)[];
};

export function chatMessage(
  messageId: number,
  senderRole: ChatSenderRole,
  content: string,
  isRead = false,
): ChatMessageBody {
  return {
    messageId,
    senderRole,
    content,
    sentAt: new Date(Date.now() - MINUTE_MS).toISOString(),
    isRead,
  };
}

export function createChatBackend(
  ownRole: ChatSenderRole,
  messages: ChatMessageBody[] = [],
): ChatBackend {
  return {
    ownRole,
    messages,
    unreadCount: messages.filter((message) => message.senderRole !== ownRole && !message.isRead)
      .length,
    canSend: true,
    refusal: null,
    sent: [],
    reads: [],
    pages: [],
  };
}

function historyPage(backend: ChatBackend, url: URL) {
  const beforeParam = url.searchParams.get('beforeId');
  const beforeId = beforeParam === null ? null : Number(beforeParam);
  const limit = Number(url.searchParams.get('limit') ?? CHAT_PAGE_SIZE);
  const older = backend.messages.filter(
    (message) => beforeId === null || message.messageId < beforeId,
  );
  const items = older.slice(-limit);
  backend.pages.push(beforeId);

  return {
    items,
    nextBeforeId: older.length > items.length ? (items[0]?.messageId ?? null) : null,
    unreadCount: backend.unreadCount,
    canSend: backend.canSend,
  };
}

function sendMessage(backend: ChatBackend, content: string): ChatMessageBody {
  const messageId = Math.max(0, ...backend.messages.map((message) => message.messageId)) + 1;
  const message = {
    ...chatMessage(messageId, backend.ownRole, content),
    sentAt: new Date().toISOString(),
  };
  backend.messages.push(message);
  backend.sent.push(content);

  return message;
}

export async function stubChatBackend(
  page: Page,
  orderId: number,
  backend: ChatBackend,
): Promise<void> {
  await page.route(`**${API_BASE_PATH}${CHAT_API_PATHS.messages(orderId)}*`, (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      return route.fulfill({ json: historyPage(backend, new URL(request.url())) });
    }

    const { content } = request.postDataJSON() as { content: string };

    return backend.refusal === null
      ? route.fulfill({ json: { message: sendMessage(backend, content) } })
      : route.fulfill({
          status: backend.refusal.status,
          json: { message: backend.refusal.message },
        });
  });
  await page.route(`**${API_BASE_PATH}${CHAT_API_PATHS.read(orderId)}`, (route) => {
    const { upToMessageId } = route.request().postDataJSON() as { upToMessageId: number };
    backend.reads.push(upToMessageId);
    backend.unreadCount = 0;
    backend.messages = backend.messages.map((message) =>
      message.senderRole !== backend.ownRole && message.messageId <= upToMessageId
        ? { ...message, isRead: true }
        : message,
    );

    return route.fulfill({ json: { readCount: 1, unreadCount: 0 } });
  });
}
