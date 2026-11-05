import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastListRequest, listRequests, stubMyOrders } from './support/my-orders';

function cards(page: Page) {
  return page.getByRole('tabpanel').getByRole('link', { name: /^№/ });
}

async function openOrders(page: Page) {
  await page.goto(APP_ROUTES.ORDERS);
  await expect(page.getByRole('heading', { level: 1, name: 'Мои заказы' })).toBeVisible();
}

test('should move between the pages on the desktop', async ({ page }) => {
  const stub = await stubMyOrders(page);
  await openOrders(page);

  await expect(page.getByText('1–5 из 8')).toBeVisible();
  await page.getByRole('button', { name: 'Следующая страница' }).click();

  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?page=2`);
  await expect(cards(page)).toHaveCount(3);
  await expect.poll(() => lastListRequest(stub)?.get('page')).toBe('2');
  await expect.poll(() => lastListRequest(stub)?.get('limit')).toBe('5');
  expect(listRequests(stub).every((params) => !params.has('cursor'))).toBe(true);

  await page.getByRole('tab', { name: /^Завершённые/ }).click();
  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?status=finished`);
  await expect(cards(page)).toHaveCount(5);
});

test('should keep the pages in place when a new order appears in another tab', async ({ page }) => {
  const stub = await stubMyOrders(page);
  await openOrders(page);
  await expect(page.getByText('1–5 из 8')).toBeVisible();
  await expect.poll(() => lastListRequest(stub)?.has('until')).toBe(false);

  stub.orders.unshift({ ...stub.orders[0], orderId: 48300, createdAt: new Date().toISOString() });
  await page.getByRole('button', { name: 'Следующая страница' }).click();

  await expect(page.getByText('6–8 из 8')).toBeVisible();
  await expect(cards(page)).toHaveCount(3);
  await expect(cards(page).first()).toContainText('48050');
  await expect.poll(() => lastListRequest(stub)?.get('until')).toBe('48232');
});
