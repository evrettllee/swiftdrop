import { expect, test } from '@playwright/test';
import {
  CHAT_SENDER_ROLE,
  type ChatHistory,
  type ChatMessage,
  type ChatSenderRole,
} from '@/shared/api';
import {
  EMPTY_CHAT,
  withLatestPage,
  withMessage,
  withOlderPage,
  withRead,
  withReadResult,
} from './chat-store';

const { CLIENT, COURIER } = CHAT_SENDER_ROLE;

function message(
  messageId: number,
  senderRole: ChatSenderRole = COURIER,
  isRead = false,
): ChatMessage {
  return {
    messageId,
    senderRole,
    content: `Сообщение ${messageId}`,
    sentAt: new Date(Date.UTC(2026, 9, 24, 12, messageId)),
    isRead,
  };
}

function page(items: ChatMessage[], nextBeforeId: number | null, unreadCount = 0): ChatHistory {
  return { items, nextBeforeId, unreadCount, canSend: true };
}

function ids(messages: readonly ChatMessage[]): number[] {
  return messages.map(({ messageId }) => messageId);
}

test('should keep one copy when the answer of a send and message:new bring the same message', () => {
  const loaded = withLatestPage(EMPTY_CHAT, page([message(1)], null, 1));
  const sent = message(2, CLIENT);

  const afterAnswer = withMessage(loaded, sent, CLIENT);
  const afterEvent = withMessage(afterAnswer, { ...sent }, CLIENT);

  expect(ids(afterEvent.messages)).toEqual([1, 2]);
  expect(afterEvent).toBe(afterAnswer);
});

test('should order the messages by id whatever order they come in', () => {
  const loaded = withLatestPage(EMPTY_CHAT, page([message(5), message(7)], 5));

  const withNew = withMessage(withMessage(loaded, message(9), CLIENT), message(8), CLIENT);
  const withOlder = withOlderPage(withNew, page([message(2), message(4)], null));

  expect(ids(withOlder.messages)).toEqual([2, 4, 5, 7, 8, 9]);
  expect(withOlder.nextBeforeId).toBeNull();
});

test('should count a new incoming message once and never an own one', () => {
  const loaded = withLatestPage(EMPTY_CHAT, page([message(1)], null, 1));

  const incoming = withMessage(loaded, message(2), CLIENT);
  const repeated = withMessage(incoming, message(2), CLIENT);
  const own = withMessage(repeated, message(3, CLIENT), CLIENT);

  expect(own.unreadCount).toBe(2);
});

test('should merge the newest page after a reconnection and keep the older pages', () => {
  const opened = withOlderPage(
    withLatestPage(EMPTY_CHAT, page([message(5), message(6)], 5)),
    page([message(3), message(4)], 3),
  );

  const reloaded = withLatestPage(opened, page([message(6), message(7)], 6, 1));

  expect(ids(reloaded.messages)).toEqual([3, 4, 5, 6, 7]);
  expect(reloaded.nextBeforeId).toBe(3);
  expect(reloaded.unreadCount).toBe(1);
});

test('should drop the kept messages when the newest page does not reach them', () => {
  const opened = withLatestPage(EMPTY_CHAT, page([message(1), message(2)], null));

  const reloaded = withLatestPage(opened, page([message(40), message(41)], 40, 2));

  expect(ids(reloaded.messages)).toEqual([40, 41]);
  expect(reloaded.nextBeforeId).toBe(40);
});

test('should tick the own messages the other side read', () => {
  const loaded = withLatestPage(
    EMPTY_CHAT,
    page([message(1, CLIENT), message(2), message(3, CLIENT)], null, 1),
  );

  const read = withRead(loaded, COURIER, 1, CLIENT);

  expect(read.messages.map(({ isRead }) => isRead)).toEqual([true, false, false]);
  expect(read.unreadCount).toBe(1);
});

test('should lower the counter by what the user read in another tab', () => {
  const loaded = withLatestPage(EMPTY_CHAT, page([message(1), message(2), message(3)], null, 3));

  const read = withRead(loaded, CLIENT, 2, CLIENT);

  expect(read.messages.map(({ isRead }) => isRead)).toEqual([true, true, false]);
  expect(read.unreadCount).toBe(1);
});

test('should take the counter of the backend after marking read', () => {
  const loaded = withLatestPage(EMPTY_CHAT, page([message(1), message(2)], null, 2));

  const read = withReadResult(loaded, 2, 0, CLIENT);

  expect(read.messages.every(({ isRead }) => isRead)).toBe(true);
  expect(read.unreadCount).toBe(0);
});
