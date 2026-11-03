import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { stubOrderActions } from './support/manager-actions';
import { FIRST_ORDER_ID, settleRequests, stubManagerOrders } from './support/manager-orders';

const PHONE = { width: 375, height: 812 };

test('should assign from the attention tab and read the table and the counts again', async ({
  page,
}) => {
  const orders = await stubManagerOrders(page);
  orders.status = ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
  orders.total = 3;
  const actions = await stubOrderActions(page);
  await page.goto('/manager/orders?status=attention');

  const row = page.getByRole('row').filter({ hasText: `№${FIRST_ORDER_ID}` });
  await row.getByRole('button', { name: 'Назначить' }).click();
  const dialog = page.getByRole('dialog', {
    name: `Назначить курьера на заказ №${FIRST_ORDER_ID}`,
  });
  await expect(dialog.getByText('Подходят для посылки: 4 курьера')).toBeVisible();
  await settleRequests(page);
  const [lists, counts] = [orders.lists.length, orders.counts.length];

  await dialog.locator('label', { hasText: 'Андрей Король' }).click();
  await dialog.getByRole('button', { name: 'Назначить', exact: true }).click();

  await expect(dialog).toBeHidden();
  expect(actions.posts[0]).toEqual({
    orderId: FIRST_ORDER_ID,
    action: 'assign',
    body: { courierId: 12 },
  });
  await expect.poll(() => orders.lists.length).toBeGreaterThan(lists);
  await expect.poll(() => orders.counts.length).toBeGreaterThan(counts);
});

test('should offer to assign and cancel in the menu by the status of the row', async ({ page }) => {
  const orders = await stubManagerOrders(page);
  orders.status = ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
  await stubOrderActions(page);
  await page.goto('/manager/orders');

  await page.getByRole('button', { name: `Действия с заказом №${FIRST_ORDER_ID}` }).click();
  const menu = page.getByRole('dialog', { name: `Действия с заказом №${FIRST_ORDER_ID}` });
  await expect(menu.getByRole('link')).toHaveText(['Открыть заказ']);
  await expect(menu.getByRole('button')).toHaveText(['Назначить курьера', 'Отменить заказ']);
  await menu.getByRole('button', { name: 'Отменить заказ' }).click();
  await expect(
    page.getByRole('dialog', { name: `Отменить заказ №${FIRST_ORDER_ID}?` }),
  ).toBeVisible();
});

test('should leave only the link in the menu of an order on its way', async ({ page }) => {
  const orders = await stubManagerOrders(page);
  orders.status = ORDER_STATUS.IN_TRANSIT;
  await page.goto('/manager/orders');

  await page.getByRole('button', { name: `Действия с заказом №${FIRST_ORDER_ID}` }).click();
  const menu = page.getByRole('dialog', { name: `Действия с заказом №${FIRST_ORDER_ID}` });
  await expect(menu.getByRole('link')).toHaveText(['Открыть заказ']);
  await expect(menu.getByRole('button')).toHaveCount(0);
});

test('should assign from a card on a phone, with the unsuitable couriers folded', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  const orders = await stubManagerOrders(page);
  orders.status = ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
  await stubOrderActions(page);
  await page.goto('/manager/orders?status=attention');

  const card = page.getByRole('article').filter({ hasText: `№${FIRST_ORDER_ID}` });
  await card.getByRole('button', { name: 'Назначить' }).click();
  const dialog = page.getByRole('dialog', { name: 'Назначить курьера' });
  await expect(dialog.getByRole('radio')).toHaveCount(4);
  const toggle = dialog.getByRole('button', { name: 'Не подходят сейчас (2)' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(dialog.getByRole('radio')).toHaveCount(6);
  await expect(dialog.getByRole('button', { name: 'Назначить', exact: true })).toBeVisible();
});
