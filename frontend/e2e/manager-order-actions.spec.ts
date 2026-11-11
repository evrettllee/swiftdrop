import { expect, type Page, test } from '@playwright/test';
import { stubOrderActions } from './support/manager-actions';
import {
  assignedOrder,
  awaitingOrder,
  MANAGER_ORDER_ID,
  type RawManagerOrder,
  stubManagerOrder,
} from './support/manager-order';

const ORDER_PATH = `/manager/orders/${MANAGER_ORDER_ID}`;
const REASON = 'Курьер не отвечает на звонки';

async function openAction(page: Page, order: RawManagerOrder, button: string, title: string) {
  const details = await stubManagerOrder(page, order);
  const actions = await stubOrderActions(page);
  await page.goto(ORDER_PATH);
  await page
    .getByRole('region', { name: 'Действия' })
    .getByRole('button', { name: button })
    .click();

  return { details, actions, dialog: page.getByRole('dialog', { name: title }) };
}

test('should reassign with the reason and the courier of the loaded order', async ({ page }) => {
  const { actions, dialog } = await openAction(
    page,
    assignedOrder(),
    'Переназначить курьера',
    'Переназначить курьера на заказ №48231',
  );

  const current = dialog.getByRole('radio', { name: /Андрей Король/ });
  await expect(current).toBeDisabled();
  await expect(current).toHaveAccessibleName(/Сейчас назначен/);
  await expect(dialog.getByText('Подходят для посылки 2,5 кг: 3 курьера')).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Все/ })).toHaveText('Все3');
  await dialog.locator('label', { hasText: 'Егор Тарасевич' }).click();
  await dialog.getByRole('textbox', { name: 'Причина' }).fill(REASON);
  await expect(dialog.getByText(`${REASON.length} / 500`)).toBeVisible();
  await dialog.getByRole('button', { name: 'Переназначить', exact: true }).click();

  await expect(dialog).toBeHidden();
  expect(actions.posts).toEqual([
    {
      orderId: MANAGER_ORDER_ID,
      action: 'reassign',
      body: { courierId: 2, expectedCourierId: 12, reason: REASON },
    },
  ]);
  await expect(page.getByText('Курьер переназначен')).toBeVisible();
});

test('should restart the assignment of a waiting order without a courier', async ({ page }) => {
  const { actions, dialog } = await openAction(
    page,
    awaitingOrder(),
    'Запустить автоназначение',
    'Запустить автоназначение для заказа №48231?',
  );

  await expect(dialog.getByText('Заказ снова начнут предлагать курьерам.')).toBeVisible();
  const submit = dialog.getByRole('button', { name: 'Запустить автоназначение' });
  await expect(submit).toHaveClass(/bg-primary/);
  await submit.click();

  await expect(dialog).toBeHidden();
  expect(actions.posts).toEqual([
    { orderId: MANAGER_ORDER_ID, action: 'restart-assignment', body: { expectedCourierId: null } },
  ]);
  await expect(page.getByText('Автоназначение запущено')).toBeVisible();
});

test('should warn that the courier is taken off and restart with the reason', async ({ page }) => {
  const { actions, dialog } = await openAction(
    page,
    assignedOrder(),
    'Запустить автоназначение',
    'Запустить автоназначение для заказа №48231?',
  );

  await expect(
    dialog.getByText(
      'Курьер Андрей Король будет снят с заказа, и заказ снова начнут предлагать курьерам.',
    ),
  ).toBeVisible();
  const submit = dialog.getByRole('button', { name: 'Запустить автоназначение' });
  await expect(submit).toHaveClass(/bg-danger-solid/);
  await dialog.getByRole('textbox', { name: 'Причина' }).fill(REASON);
  await submit.click();

  await expect(dialog).toBeHidden();
  expect(actions.posts[0]?.body).toEqual({ expectedCourierId: 12, reason: REASON });
});

test('should show the error of the reason field from the server', async ({ page }) => {
  const { actions, dialog } = await openAction(
    page,
    assignedOrder(),
    'Запустить автоназначение',
    'Запустить автоназначение для заказа №48231?',
  );
  actions.failures.push({
    status: 400,
    body: {
      message: 'Ошибка',
      errors: [{ field: 'reason', message: 'Причина: от 1 до 500 символов' }],
    },
  });

  await dialog.getByRole('textbox', { name: 'Причина' }).fill(REASON);
  await dialog.getByRole('button', { name: 'Запустить автоназначение' }).click();

  await expect(dialog.getByRole('textbox', { name: 'Причина' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(dialog.getByText('Причина: от 1 до 500 символов')).toBeVisible();
});
