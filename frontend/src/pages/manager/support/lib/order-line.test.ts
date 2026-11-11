import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '@/shared/api';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { orderLine } from './order-line';

const ORDER = {
  orderId: 48232,
  status: ORDER_STATUS.IN_TRANSIT,
  deliveryAddress: 'Минск, Сурганова, 12',
};
const AT = new Date(2026, 9, 26, 14, 10);

function details(patch: Partial<ManagerOrderDetails>): ManagerOrderDetails {
  return {
    id: 48232,
    status: ORDER_STATUS.IN_TRANSIT,
    statusChangedAt: AT,
    finishedAt: null,
    courier: null,
    payment: { state: 'paid', paidAt: AT, refundedAt: null },
    history: [],
    ...patch,
  } as ManagerOrderDetails;
}

test('should show the status and the address until the order is loaded', () => {
  expect(orderLine(ORDER, null)).toEqual({ text: 'В пути · Минск, Сурганова, 12', phone: null });
});

test('should name the courier of an active order with the phone apart', () => {
  const line = orderLine(
    ORDER,
    details({ courier: { id: 7, name: 'Дмитрий Соколов', phone: '+375295551234', vehicle: null } }),
  );

  expect(line).toEqual({ text: 'В пути, курьер Дмитрий Соколов', phone: '+375295551234' });
});

test('should say who cancelled the order and that the money came back', () => {
  const cancelled = details({
    status: ORDER_STATUS.CANCELLED,
    finishedAt: AT,
    payment: { state: 'refunded', paidAt: AT, refundedAt: AT },
    history: [
      {
        status: ORDER_STATUS.CANCELLED,
        changedAt: AT,
        actor: 'client',
        actorName: null,
        comment: null,
      },
    ],
  });

  expect(orderLine(ORDER, cancelled).text).toBe('Отменён клиентом в 14:10, деньги возвращены');
});

test('should give the time of the delivery of a delivered order', () => {
  const delivered = details({ status: ORDER_STATUS.DELIVERED, finishedAt: AT });

  expect(orderLine(ORDER, delivered).text).toBe('Доставлен в 14:10');
});
