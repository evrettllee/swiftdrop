import { expect, test } from '@playwright/test';
import { ORDER_CANCELLED_BY, ORDER_STATUS, type OrderDetails } from '@/shared/api';
import { formatTime } from '@/shared/lib/format';
import { at, line, MINUTE, order, paid, refunded } from './status-line-fixture';

test('should tell the time of the delivery and the recipient with a check', () => {
  const delivered = order(ORDER_STATUS.DELIVERED, paid, { [ORDER_STATUS.DELIVERED]: 51 * MINUTE });

  expect(line(delivered)).toEqual({
    icon: 'check-circle',
    title: `Доставлен в ${formatTime(at(51 * MINUTE))}`,
    text: 'Получатель: Ирина Козлова',
  });
});

test('should tell why the order was cancelled', () => {
  const { CLIENT, SYSTEM, STAFF } = ORDER_CANCELLED_BY;
  const cancelled = (cancelledBy: OrderDetails['cancelledBy'], changes = {}) =>
    line(order(ORDER_STATUS.CANCELLED, { ...changes, cancelledBy }));

  expect(cancelled(CLIENT, refunded)).toEqual({
    icon: 'x-circle',
    title: 'Заказ отменён',
    text: 'Оплата возвращена на карту.',
  });
  expect(cancelled(SYSTEM, refunded).text).toBe('Оплата возвращена на карту.');
  expect([SYSTEM, CLIENT, STAFF].map((by) => cancelled(by).text)).toEqual([
    'Не оплачен за 30 минут',
    'Деньги не списаны.',
    'Деньги не списаны.',
  ]);
});

test('should promise the money back for a rejected order only when it was paid', () => {
  expect(line(order(ORDER_STATUS.REJECTED, paid))).toEqual({
    icon: 'x-circle',
    title: 'Заказ отклонён',
    text: 'Деньги вернутся на карту',
  });
  expect(line(order(ORDER_STATUS.REJECTED)).text).toBeNull();
});
