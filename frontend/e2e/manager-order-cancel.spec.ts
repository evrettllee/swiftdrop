import { expect, type Page, test } from '@playwright/test';
import { type ActionsStub, stubOrderActions } from './support/manager-actions';
import { awaitingOrder, MANAGER_ORDER_ID, stubManagerOrder } from './support/manager-order';

const ORDER_PATH = `/manager/orders/${MANAGER_ORDER_ID}`;
const REASON = 'Клиент попросил отменить по телефону: посылку заберёт сам.';

async function openCancel(page: Page, isPaid = true) {
  const order = awaitingOrder();
  const details = await stubManagerOrder(
    page,
    isPaid ? order : { ...order, payment: { state: 'unpaid', paidAt: null, refundedAt: null } },
  );
  const actions = await stubOrderActions(page);
  await page.goto(ORDER_PATH);
  await page
    .getByRole('region', { name: 'Действия' })
    .getByRole('button', { name: 'Отменить заказ' })
    .click();

  return { details, actions, dialog: page.getByRole('dialog', { name: 'Отменить заказ №48231?' }) };
}

test('should ask for the reason before cancelling and show the refund', async ({ page }) => {
  const { actions, dialog } = await openCancel(page);

  await expect(dialog.getByText('Клиент увидит причину на странице заказа.')).toBeVisible();
  await expect(dialog.getByText('Клиенту вернётся 12,30 BYN')).toBeVisible();
  await expect(
    dialog.getByText('Возврат через Stripe, на карту клиента деньги придут за 5–10 дней.'),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Отменить заказ' }).click();
  await expect(dialog.getByText('Укажите причину отмены')).toBeVisible();
  expect(actions.posts).toHaveLength(0);
  await expect(dialog.getByRole('button', { name: 'Не отменять' })).toBeVisible();
});

test('should not promise a refund for an unpaid order', async ({ page }) => {
  const { dialog } = await openCancel(page, false);

  await expect(dialog.getByRole('textbox', { name: 'Причина' })).toBeVisible();
  await expect(dialog.getByText(/Клиенту вернётся/)).toHaveCount(0);
});

const REFUNDS: [ActionsStub['refund'], string][] = [
  ['refunded', 'Заказ отменён, деньги возвращены'],
  ['pending', 'Заказ отменён, возврат в обработке'],
  ['none', 'Заказ отменён'],
];

for (const [refund, toast] of REFUNDS) {
  test(`should cancel with the reason and tell the refund ${refund}`, async ({ page }) => {
    const { details, actions, dialog } = await openCancel(page);
    actions.refund = refund;
    const before = details.orderRequests.length;

    await dialog.getByRole('textbox', { name: 'Причина' }).fill(REASON);
    await expect(dialog.getByText(`${REASON.length} / 500`)).toBeVisible();
    await dialog.getByRole('button', { name: 'Отменить заказ' }).click();

    await expect(dialog).toBeHidden();
    expect(actions.posts).toEqual([
      { orderId: MANAGER_ORDER_ID, action: 'cancel', body: { reason: REASON } },
    ]);
    await expect(page.getByText(toast, { exact: true })).toBeVisible();
    await expect.poll(() => details.orderRequests.length).toBeGreaterThan(before);
  });
}
