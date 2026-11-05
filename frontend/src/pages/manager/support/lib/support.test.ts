import { expect, test } from '@playwright/test';
import type { SupportMessage } from '@/shared/support-api';
import { groupByDay } from '@/shared/ui/chat';
import { closedLine } from './ticket-lines';

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

test('should group the messages by the day they were written', () => {
  const now = new Date(2026, 9, 26, 18, 0).getTime();
  const days = groupByDay(
    [message(1, { createdAt: new Date(2026, 9, 25, 23, 50) }), message(2), message(3)],
    (item) => item.createdAt,
    now,
  );

  expect(days.map((day) => [day.label, day.items.map((item) => item.id)])).toEqual([
    ['25 октября', [1]],
    ['Сегодня', [2, 3]],
  ]);
});

test('should say when the ticket was closed and by whom', () => {
  const closedAt = new Date(2026, 9, 26, 14, 40);

  expect(closedLine({ closedAt, closedBy: { role: 'staff', name: 'Ольга М.' } })).toBe(
    'Обращение закрыто 26.10, 14:40 · Ольга М.',
  );
  expect(closedLine({ closedAt, closedBy: { role: 'author', name: 'Анна Кравец' } })).toBe(
    'Обращение закрыто 26.10, 14:40 · Анна Кравец',
  );
  expect(closedLine({ closedAt, closedBy: null })).toBe('Обращение закрыто 26.10, 14:40');
  expect(closedLine({ closedAt: null, closedBy: null })).toBeNull();
});
