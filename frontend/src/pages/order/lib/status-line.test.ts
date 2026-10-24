import { expect, test } from '@playwright/test';
import { ORDER_STATUS, type OrderDetails, type OrderStatus, PAYMENT_STATUS } from '@/shared/api';
import { formatTime } from '@/shared/lib/format';
import { getStatusLine, type StatusLine, type StatusLineSource } from './status-line';

const CREATED_MS = Date.parse('2026-10-24T12:00:00Z');
const NOW_MS = CREATED_MS + 20 * 60_000;
const MINUTE = 60_000;
const POINT = {
  city: 'Минск',
  street: 'Ленина',
  house: '1',
  apartment: null,
  latitude: 53.9,
  longitude: 27.5,
};

function at(offsetMs: number): Date {
  return new Date(CREATED_MS + offsetMs);
}

function order(
  status: OrderStatus,
  changes: Partial<OrderDetails> = {},
  historyAt: Partial<Record<OrderStatus, number>> = {},
): OrderDetails {
  return {
    orderId: 7,
    status,
    price: 9.23,
    currency: 'BYN',
    priceCoefficient: 1,
    distanceKm: 7.98,
    estimatedMinutes: 24,
    estimatedDeliveryAt: at(58 * MINUTE),
    createdAt: at(0),
    recipient: { name: 'Ирина Козлова', phone: '+375291234567' },
    parcel: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true },
    pickup: POINT,
    delivery: POINT,
    history: Object.entries({ [ORDER_STATUS.PENDING]: 0, ...historyAt }).map(([entry, offset]) => ({
      status: entry as OrderStatus,
      changedAt: at(offset),
    })),
    payment: null,
    ...changes,
  };
}

const NO_TRACKING: StatusLineSource['tracking'] = {
  estimatedDeliveryAt: null,
  pickupEtaAt: null,
  isPositionStale: false,
  positionReceivedAt: null,
};

function line(
  details: OrderDetails,
  tracking: Partial<StatusLineSource['tracking']> = {},
  payment = { isChecking: false, isFailed: false },
): StatusLine {
  return getStatusLine({
    order: details,
    payment,
    tracking: { ...NO_TRACKING, ...tracking },
    nowMs: NOW_MS,
  });
}

const paid = { payment: { status: PAYMENT_STATUS.PAID, amountUsd: 3.2 } };
const refunded = { payment: { status: PAYMENT_STATUS.REFUNDED, amountUsd: 3.2 } };
const deadline = formatTime(at(30 * MINUTE));

test('should ask to pay with a clock, tell a failed payment with a cross, a check without', () => {
  const pending = order(ORDER_STATUS.PENDING);

  expect(line(pending)).toEqual({
    icon: 'clock',
    title: 'Заказ ждёт оплаты',
    text: `Оплатите до ${deadline}, иначе заказ отменится автоматически.`,
  });
  expect(line(pending, {}, { isChecking: false, isFailed: true })).toMatchObject({
    icon: 'x-circle',
    title: 'Платёж не прошёл',
  });
  expect(line(pending, {}, { isChecking: true, isFailed: false })).toMatchObject({
    icon: null,
    title: 'Проверяем оплату',
  });
});

test('should search for a courier without an icon', () => {
  for (const status of [ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT]) {
    expect(line(order(status))).toEqual({
      icon: null,
      title: 'Ищем курьера рядом с точкой забора',
      text: 'Как только курьер примет заказ, он появится на карте.',
    });
  }
});

test('should count the minutes to the pickup up and give the delivery time under them', () => {
  const assigned = order(ORDER_STATUS.COURIER_ASSIGNED);

  expect(line(assigned, { pickupEtaAt: new Date(NOW_MS + 6 * MINUTE + 10_000) })).toEqual({
    icon: null,
    title: 'Курьер приедет за посылкой через 7 мин',
    text: `Доставка ориентировочно к ${formatTime(at(58 * MINUTE))}`,
  });
  expect(line(assigned)).toEqual({
    icon: null,
    title: `Доставка ориентировочно к ${formatTime(at(58 * MINUTE))}`,
    text: null,
  });
});

test('should count the minutes to the delivery once the parcel is on its way', () => {
  for (const status of [ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT]) {
    expect(line(order(status), { estimatedDeliveryAt: new Date(NOW_MS + 12 * MINUTE) })).toEqual({
      icon: null,
      title: 'Курьер привезёт посылку через 12 мин',
      text: `Доставка ориентировочно к ${formatTime(new Date(NOW_MS + 12 * MINUTE))}`,
    });
  }
});

test('should say the connection is lost with the minutes since the last position', () => {
  const stale = { isPositionStale: true, positionReceivedAt: NOW_MS - 2 * MINUTE - 5_000 };

  expect(line(order(ORDER_STATUS.IN_TRANSIT), stale)).toEqual({
    icon: 'wifi-x',
    title: 'Нет связи с курьером',
    text: 'Обновлено 2 мин назад. Время уточнится, когда связь вернётся.',
  });
});

test('should tell the time of the delivery and the recipient with a check', () => {
  const delivered = order(ORDER_STATUS.DELIVERED, paid, { [ORDER_STATUS.DELIVERED]: 51 * MINUTE });

  expect(line(delivered)).toEqual({
    icon: 'check-circle',
    title: `Доставлен в ${formatTime(at(51 * MINUTE))}`,
    text: 'Получатель: Ирина Козлова',
  });
});

test('should tell why the order was cancelled', () => {
  const cancelled = (changes: Partial<OrderDetails>, cancelledAt: number) =>
    line(order(ORDER_STATUS.CANCELLED, changes, { [ORDER_STATUS.CANCELLED]: cancelledAt }));

  expect(cancelled(refunded, 10 * MINUTE)).toEqual({
    icon: 'x-circle',
    title: 'Заказ отменён',
    text: 'Оплата возвращена на карту.',
  });
  expect(cancelled({}, 30 * MINUTE).text).toBe('Не оплачен за 30 минут');
  expect(cancelled({}, 5 * MINUTE).text).toBe('Деньги не списаны.');
});

test('should promise the money back for a rejected order only when it was paid', () => {
  expect(line(order(ORDER_STATUS.REJECTED, paid))).toEqual({
    icon: 'x-circle',
    title: 'Заказ отклонён',
    text: 'Деньги вернутся на карту',
  });
  expect(line(order(ORDER_STATUS.REJECTED)).text).toBeNull();
});
