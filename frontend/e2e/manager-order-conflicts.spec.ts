import { expect, type Page, test } from '@playwright/test';
import { type ActionFailureStub, stubOrderActions } from './support/manager-actions';
import { awaitingOrder, MANAGER_ORDER_ID, stubManagerOrder } from './support/manager-order';

const ORDER_PATH = `/manager/orders/${MANAGER_ORDER_ID}`;

async function assignWithFailure(page: Page, failure: ActionFailureStub) {
  const order = await stubManagerOrder(page, awaitingOrder());
  const actions = await stubOrderActions(page);
  actions.failures.push(failure);
  await page.goto(ORDER_PATH);
  await page
    .getByRole('region', { name: 'Действия' })
    .getByRole('button', { name: 'Назначить курьера' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Назначить курьера на заказ №48231' });
  await dialog.locator('label', { hasText: 'Андрей Король' }).click();
  const ordersBefore = order.orderRequests.length;
  const candidatesBefore = actions.candidateRequests.length;
  await dialog.getByRole('button', { name: 'Назначить', exact: true }).click();

  return { order, actions, dialog, ordersBefore, candidatesBefore };
}

for (const code of [
  'ORDER_NOT_ASSIGNABLE',
  'ORDER_NOT_REASSIGNABLE',
  'ORDER_NOT_RESTARTABLE',
  'ORDER_NOT_CANCELLABLE',
  'COURIER_CHANGED',
]) {
  test(`should say the order has changed for ${code} and refresh the page on demand`, async ({
    page,
  }) => {
    const { order, dialog, ordersBefore } = await assignWithFailure(page, {
      status: 409,
      body: { code, message: 'conflict', currentCourierId: 7 },
    });

    await expect(dialog.getByRole('alert')).toContainText('Заказ уже изменился');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Обновить' }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => order.orderRequests.length).toBeGreaterThan(ordersBefore);
  });
}

test('should explain why the courier cannot take the order and read the lists again', async ({
  page,
}) => {
  const { order, actions, dialog, ordersBefore, candidatesBefore } = await assignWithFailure(page, {
    status: 409,
    body: { code: 'COURIER_NOT_AVAILABLE', reason: 'busy', message: 'busy' },
  });

  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('Курьер не может взять заказ');
  await expect(alert).toContainText('Везёт другой заказ');
  await expect(dialog).toBeVisible();
  await expect.poll(() => order.orderRequests.length).toBeGreaterThan(ordersBefore);
  await expect.poll(() => actions.candidateRequests.length).toBeGreaterThan(candidatesBefore);
  await expect(dialog.getByRole('button', { name: 'Обновить' })).toHaveCount(0);
});

test('should ask to try again when the order is busy', async ({ page }) => {
  const { dialog } = await assignWithFailure(page, {
    status: 409,
    body: { message: 'Заказ или курьер сейчас обновляются. Попробуйте ещё раз' },
  });

  await expect(dialog.getByRole('alert')).toContainText('Заказ или курьер сейчас обновляются');
  await expect(dialog).toBeVisible();
});

test('should offer to repeat after a network failure', async ({ page }) => {
  const { actions, dialog } = await assignWithFailure(page, 'network');

  await expect(dialog.getByRole('alert')).toContainText('Не удалось выполнить действие');
  await dialog.getByRole('button', { name: 'Повторить' }).click();
  await expect(dialog).toBeHidden();
  expect(actions.posts).toHaveLength(2);
});
