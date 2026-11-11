import { expect, test } from '@playwright/test';
import { CHAT_SENDER_ROLE, type ChatMessage } from '@/shared/api';
import { groupByDay } from './day-groups';

function message(messageId: number, sentAt: Date): ChatMessage {
  return {
    messageId,
    senderRole: CHAT_SENDER_ROLE.COURIER,
    content: 'Текст',
    sentAt,
    isRead: true,
  };
}

const NOW = new Date(2026, 9, 24, 15, 0);
const sentAtOf = (item: ChatMessage) => item.sentAt;

test('should put the messages of one day under one label, today as «Сегодня»', () => {
  const days = groupByDay(
    [
      message(1, new Date(2026, 9, 22, 12, 0)),
      message(2, new Date(2026, 9, 22, 12, 5)),
      message(3, new Date(2026, 9, 24, 9, 0)),
      message(4, new Date(2026, 9, 24, 14, 30)),
    ],
    sentAtOf,
    NOW.getTime(),
  );

  expect(days.map(({ label, items }) => [label, items.map((item) => item.messageId)])).toEqual([
    ['22 октября', [1, 2]],
    ['Сегодня', [3, 4]],
  ]);
});

test('should name the year of a day of another year', () => {
  const [day] = groupByDay([message(1, new Date(2025, 11, 31, 12, 0))], sentAtOf, NOW.getTime());

  expect(day.label).toBe('31 декабря 2025 г.');
});

test('should give no days without messages', () => {
  expect(groupByDay([], sentAtOf, NOW.getTime())).toEqual([]);
});
