import { expect, test } from '@playwright/test';
import type { OrderSupportTicket } from '@/shared/api';
import { entryLabel, entryStatusLine } from './entry-lines';

const NOW = new Date(2026, 9, 26, 18, 0);

function ticket(patch: Partial<OrderSupportTicket> = {}): OrderSupportTicket {
  return {
    ticketId: 91,
    status: 'open',
    awaitingStaff: false,
    unreadCount: 0,
    lastMessageAt: new Date(2026, 9, 26, 15, 21),
    ...patch,
  };
}

test('should say who waits and when the last message came', () => {
  expect(entryStatusLine(ticket(), NOW)).toBe('Есть ответ поддержки, 15:21');
  expect(entryStatusLine(ticket({ awaitingStaff: true }), NOW)).toBe(
    'Ждёт ответа поддержки, 15:21',
  );
  expect(entryStatusLine(ticket({ lastMessageAt: new Date(2026, 9, 25, 9, 5) }), NOW)).toBe(
    'Есть ответ поддержки, 25 окт, 09:05',
  );
});

test('should name the row with the state and the unread replies', () => {
  expect(entryLabel(ticket({ unreadCount: 1 }), NOW)).toBe(
    'Обращение по заказу, Есть ответ поддержки, 15:21, 1 новое сообщение',
  );
  expect(entryLabel(ticket({ unreadCount: 3 }), NOW)).toBe(
    'Обращение по заказу, Есть ответ поддержки, 15:21, 3 новых сообщения',
  );
  expect(entryLabel(ticket({ unreadCount: 5 }), NOW)).toBe(
    'Обращение по заказу, Есть ответ поддержки, 15:21, 5 новых сообщений',
  );
  expect(entryLabel(ticket({ awaitingStaff: true }), NOW)).toBe(
    'Обращение по заказу, Ждёт ответа поддержки, 15:21',
  );
});
