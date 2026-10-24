import { expect, test } from '@playwright/test';
import { CHAT_SENDER_ROLE, type ChatMessage, type ChatSenderRole } from '@/shared/api';
import { getReadTargetId } from './read-target';

const { CLIENT, COURIER } = CHAT_SENDER_ROLE;

function message(messageId: number, senderRole: ChatSenderRole, isRead: boolean): ChatMessage {
  return { messageId, senderRole, content: 'Текст', sentAt: new Date(), isRead };
}

test('should mark up to the last incoming message, not an own one after it', () => {
  const messages = [
    message(1, COURIER, true),
    message(2, COURIER, false),
    message(3, COURIER, false),
    message(4, CLIENT, false),
  ];

  expect(getReadTargetId(messages, CLIENT)).toBe(3);
});

test('should ask for nothing when every incoming message is read', () => {
  const messages = [message(1, COURIER, true), message(2, CLIENT, false)];

  expect(getReadTargetId(messages, CLIENT)).toBeNull();
});

test('should ask for nothing without incoming messages', () => {
  expect(getReadTargetId([message(1, CLIENT, false)], CLIENT)).toBeNull();
  expect(getReadTargetId([], COURIER)).toBeNull();
});

test('should read for the side of the user: the courier reads the client', () => {
  const messages = [message(1, CLIENT, false), message(2, COURIER, false)];

  expect(getReadTargetId(messages, COURIER)).toBe(1);
});
