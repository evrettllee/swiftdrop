import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '@/shared/api';
import { at, BASE_HISTORY, managerOrder } from './order-fixture';
import { buildManagerProgress } from './progress';

test('should show the manual search step only when the order went through it', () => {
  const assigned = managerOrder({
    status: ORDER_STATUS.COURIER_ASSIGNED,
    history: [
      ...BASE_HISTORY,
      {
        status: ORDER_STATUS.COURIER_ASSIGNED,
        changedAt: at(2),
        actor: 'courier',
        actorName: null,
        comment: null,
      },
    ],
  });

  expect(buildManagerProgress(assigned).map((step) => step.label)).not.toContain('Ждёт назначения');
  expect(buildManagerProgress(managerOrder()).map((step) => [step.label, step.state])).toEqual([
    ['Новый', 'done'],
    ['Подтверждён', 'done'],
    ['Ждёт назначения', 'current'],
    ['Курьер назначен', 'todo'],
    ['Курьер забрал', 'todo'],
    ['В пути', 'todo'],
    ['Доставлен', 'todo'],
  ]);
});

test('should name who changed each step and give the reason of a reassignment', () => {
  const order = managerOrder({
    status: ORDER_STATUS.COURIER_ASSIGNED,
    history: [
      ...BASE_HISTORY,
      {
        status: ORDER_STATUS.COURIER_ASSIGNED,
        changedAt: at(10),
        actor: 'staff',
        actorName: 'Ольга М.',
        comment: null,
      },
      {
        status: ORDER_STATUS.COURIER_ASSIGNED,
        changedAt: at(20),
        actor: 'staff',
        actorName: 'Ольга М.',
        comment: 'Курьер заболел',
      },
    ],
  });
  const steps = buildManagerProgress(order);

  expect(steps.map((step) => step.notes)).toEqual([
    ['Клиент'],
    ['Система'],
    ['Ольга М.', '15:07 · Ольга М. · Курьер заболел'],
    [],
    [],
    [],
  ]);
});

test('should end a cancelled order with the stop step and its reason', () => {
  const order = managerOrder({
    status: ORDER_STATUS.CANCELLED,
    history: [
      ...BASE_HISTORY,
      {
        status: ORDER_STATUS.CANCELLED,
        changedAt: at(5),
        actor: 'staff',
        actorName: 'Ольга М.',
        comment: 'Адрес вне зоны',
      },
    ],
  });

  expect(buildManagerProgress(order).at(-1)).toMatchObject({
    label: 'Отменён',
    state: 'stopped',
    notes: ['Ольга М. · Адрес вне зоны'],
  });
});
