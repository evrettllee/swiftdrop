import { expect, test } from '@playwright/test';
import { SUPPORT_TOPIC } from '@/shared/support-api';
import {
  needsSubject,
  parseIdParam,
  toNewTicket,
  validateDraft,
  withChosenOrder,
} from './new-ticket';
import { dayTime, orderSummary, previewLine, ticketStateOf } from './ticket-lines';

const NOW = new Date(2026, 9, 26, 18, 0);

test('should tell the state of a ticket from its status and who waits', () => {
  expect(ticketStateOf({ status: 'open', awaitingStaff: true })).toBe('awaiting');
  expect(ticketStateOf({ status: 'open', awaitingStaff: false })).toBe('answered');
  expect(ticketStateOf({ status: 'closed', awaitingStaff: false })).toBe('closed');
  expect(ticketStateOf({ status: 'closed', awaitingStaff: true })).toBe('closed');
});

test('should ask for a subject only for the topic «Другое»', () => {
  const draft = { topic: SUPPORT_TOPIC.OTHER, subject: '  ', orderId: null, message: 'Текст' };

  expect(needsSubject(SUPPORT_TOPIC.OTHER)).toBe(true);
  expect(needsSubject(SUPPORT_TOPIC.PAYMENT)).toBe(false);
  expect(validateDraft(draft)).toEqual({ subject: 'Напишите тему обращения' });
  expect(validateDraft({ ...draft, topic: SUPPORT_TOPIC.APP })).toEqual({});
  expect(validateDraft({ ...draft, subject: 'Не приходят заказы', message: ' ' })).toEqual({
    message: 'Напишите сообщение',
  });
  expect(toNewTicket({ ...draft, subject: ' Не приходят заказы ', message: ' Да ' })).toEqual({
    topic: SUPPORT_TOPIC.OTHER,
    subject: 'Не приходят заказы',
    orderId: null,
    message: 'Да',
  });
  expect(toNewTicket({ ...draft, topic: SUPPORT_TOPIC.ACCOUNT, subject: 'Лишнее' }).subject).toBe(
    null,
  );
});

test('should take the order of the address only when it is a whole positive number', () => {
  expect(parseIdParam('48232')).toBe(48232);
  expect(parseIdParam(null)).toBeNull();
  expect(parseIdParam('0')).toBeNull();
  expect(parseIdParam('-5')).toBeNull();
  expect(parseIdParam('12a')).toBeNull();
  expect(parseIdParam('9999999999')).toBeNull();
});

test('should keep the order of the address in the choice even when it is not recent', () => {
  const orders = [{ orderId: 2 }, { orderId: 1 }];
  const fallback = (orderId: number) => ({ orderId });

  expect(withChosenOrder(orders, 1, fallback)).toEqual(orders);
  expect(withChosenOrder(orders, 7, fallback)).toEqual([{ orderId: 7 }, ...orders]);
  expect(withChosenOrder(orders, null, fallback)).toEqual(orders);
});

test('should write the lines of a ticket and of an order', () => {
  expect(dayTime(new Date(2026, 9, 26, 14, 58), NOW)).toBe('Сегодня, 14:58');
  expect(dayTime(new Date(2026, 9, 25, 9, 5), NOW)).toBe('25 окт, 09:05');
  expect(
    previewLine({
      order: { orderId: 48232, status: 'in_transit' },
      lastMessage: { text: 'Сейчас передам курьеру', fromStaff: true, createdAt: NOW },
    }),
  ).toBe('Заказ №48232, поддержка: Сейчас передам курьеру');
  expect(
    previewLine({
      order: null,
      lastMessage: { text: 'Стою у двери', fromStaff: false, createdAt: NOW },
    }),
  ).toBe('вы: Стою у двери');

  const order = {
    at: new Date(2026, 9, 26, 14, 0),
    status: 'in_transit',
    address: 'пр-т Притыцкого, 83',
  } as const;

  expect(orderSummary(order, NOW, true)).toBe('Сегодня, в пути, пр-т Притыцкого, 83');
  expect(orderSummary(order, NOW, false)).toBe('Сегодня, в пути');
  expect(orderSummary({ ...order, at: null }, NOW, false)).toBe('В пути');
});
