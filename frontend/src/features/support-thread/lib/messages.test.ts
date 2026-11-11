import { expect, test } from '@playwright/test';
import { SUPPORT_SIDE, type SupportMessage } from '@/shared/support-api';
import { lastIncomingMessageId, markOwnMessagesRead, mergeMessages } from './messages';

function message(id: number, patch: Partial<SupportMessage> = {}): SupportMessage {
  return {
    id,
    text: `Сообщение ${id}`,
    createdAt: new Date(2026, 9, 26, 14, id),
    fromStaff: false,
    authorName: 'Анна Кравец',
    isRead: false,
    ...patch,
  };
}

test('should merge pages and live messages by id in the order of ids', () => {
  const merged = mergeMessages(
    [message(3), message(5)],
    [message(5, { text: 'Новее' }), message(1), message(4)],
  );

  expect(merged.map((item) => item.id)).toEqual([1, 3, 4, 5]);
  expect(merged.at(-1)?.text).toBe('Новее');
  expect(mergeMessages([], [])).toEqual([]);
  expect(mergeMessages([message(2)], [message(2)])).toHaveLength(1);
});

test('should mark the own messages of the staff as read and find the last of the author', () => {
  const messages = [message(1), message(2, { fromStaff: true }), message(3)];
  const read = markOwnMessagesRead(messages, SUPPORT_SIDE.STAFF);

  expect(read.map((item) => item.isRead)).toEqual([false, true, false]);
  expect(read[0]).toBe(messages[0]);
  expect(lastIncomingMessageId(messages, SUPPORT_SIDE.STAFF)).toBe(3);
  expect(lastIncomingMessageId([message(4, { fromStaff: true })], SUPPORT_SIDE.STAFF)).toBeNull();
});

test('should mark the own messages of the author as read and find the last of the staff', () => {
  const messages = [message(1), message(2, { fromStaff: true }), message(3)];
  const read = markOwnMessagesRead(messages, SUPPORT_SIDE.AUTHOR);

  expect(read.map((item) => item.isRead)).toEqual([true, false, true]);
  expect(read[1]).toBe(messages[1]);
  expect(lastIncomingMessageId(messages, SUPPORT_SIDE.AUTHOR)).toBe(2);
  expect(lastIncomingMessageId([message(4)], SUPPORT_SIDE.AUTHOR)).toBeNull();
});
