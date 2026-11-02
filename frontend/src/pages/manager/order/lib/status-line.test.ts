import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '@/shared/api';
import type { ManagerOrderOffer } from '@/shared/staff-api';
import { at, managerOrder, MINUTE, START_MS } from './order-fixture';
import { getStatusLine, STATUS_LINE_TONE } from './status-line';

function offer(courierId: number, status: ManagerOrderOffer['status']): ManagerOrderOffer {
  return {
    round: 1,
    courier: { id: courierId, name: `Курьер ${courierId}`, vehicleType: null },
    status,
    pickupEtaSec: 360,
    offeredAt: at(1),
    respondedAt: null,
  };
}

function assignedBy(actor: 'courier' | 'staff', minute: number, comment: string | null = null) {
  return {
    status: ORDER_STATUS.COURIER_ASSIGNED,
    changedAt: at(minute),
    actor,
    actorName: actor === 'staff' ? 'Ольга М.' : null,
    comment,
  };
}

test('should count the couriers the order was offered to while it waits for a manager', () => {
  const order = managerOrder({
    offers: [offer(1, 'expired'), offer(2, 'declined'), offer(2, 'expired'), offer(3, 'revoked')],
  });

  expect(getStatusLine({ order, pickupEtaAt: null, nowMs: START_MS + 41 * MINUTE })).toEqual({
    tone: STATUS_LINE_TONE.WARNING,
    title: 'Автоназначение не нашло курьера',
    text: 'Заказ предлагали 3 курьерам, никто не принял. Ждёт назначения 35 мин.',
  });
});

test('should say who assigned the courier by hand and when the parcel is expected', () => {
  const order = managerOrder({
    status: ORDER_STATUS.COURIER_ASSIGNED,
    estimatedDeliveryAt: new Date('2026-10-26T13:00:00Z'),
    history: [assignedBy('staff', 37)],
  });
  const line = getStatusLine({ order, pickupEtaAt: at(46), nowMs: START_MS + 37 * MINUTE });

  expect(line.title).toBe('Курьер приедет за посылкой через 9 мин');
  expect(line.text).toBe('Назначен вручную в 15:24, Ольга М. Доставка ориентировочно к 16:00.');
});

test('should tell a reassignment from an assignment and keep quiet without an estimate', () => {
  const order = managerOrder({
    status: ORDER_STATUS.COURIER_ASSIGNED,
    history: [assignedBy('courier', 10), assignedBy('staff', 20, 'Курьер заболел')],
  });

  expect(getStatusLine({ order, pickupEtaAt: null, nowMs: START_MS })).toEqual({
    tone: STATUS_LINE_TONE.NONE,
    title: 'Курьер едет за посылкой',
    text: 'Переназначен в 15:07, Ольга М.',
  });
});

test('should give the reason of a cancel by the staff', () => {
  const order = managerOrder({
    status: ORDER_STATUS.CANCELLED,
    history: [
      {
        status: ORDER_STATUS.CANCELLED,
        changedAt: at(13),
        actor: 'staff',
        actorName: 'Ольга М.',
        comment: 'Адрес вне зоны',
      },
    ],
  });

  expect(getStatusLine({ order, pickupEtaAt: null, nowMs: START_MS })).toEqual({
    tone: STATUS_LINE_TONE.DANGER,
    title: 'Заказ отменён',
    text: 'Отменён сотрудником в 15:00, Ольга М. Причина: Адрес вне зоны',
  });
});

test('should say when a delivered order was handed over', () => {
  const order = managerOrder({ status: ORDER_STATUS.DELIVERED, finishedAt: at(50) });

  expect(getStatusLine({ order, pickupEtaAt: null, nowMs: START_MS })).toEqual({
    tone: STATUS_LINE_TONE.SUCCESS,
    title: 'Доставлен в 15:37',
    text: 'Получатель: Светлана Шуляк.',
  });
});
