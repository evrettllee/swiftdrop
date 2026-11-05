import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastListRequest, listRequests, minskDay, stubMyOrders } from './support/my-orders';
import { myOrders, olderOrders } from './support/my-orders-fixtures';

const MANY_ORDERS = [...myOrders(), ...olderOrders(17)];

test.use({ viewport: { width: 375, height: 812 } });

function cards(page: Page) {
  return page.getByRole('tabpanel').getByRole('link', { name: /^№/ });
}

async function openOrders(page: Page) {
  await page.goto(APP_ROUTES.ORDERS);
  await expect(page.getByRole('heading', { level: 1, name: 'Мои заказы' })).toBeVisible();
}

test('should show more orders by the cursor and count the shown ones', async ({ page }) => {
  const stub = await stubMyOrders(page, MANY_ORDERS);
  await openOrders(page);

  await expect(cards(page)).toHaveCount(20);
  await expect(page.getByText('Показано 20 из 25')).toBeVisible();
  await expect.poll(() => lastListRequest(stub)?.get('cursor')).toBe('');
  expect(listRequests(stub).every((params) => !params.has('page'))).toBe(true);

  await page.getByRole('button', { name: 'Показать ещё' }).click();

  await expect(cards(page)).toHaveCount(25);
  await expect.poll(() => lastListRequest(stub)?.get('cursor')).toBe('20');
  await expect(page.getByRole('button', { name: 'Показать ещё' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('should start the list over when the filters change', async ({ page }) => {
  const stub = await stubMyOrders(page, MANY_ORDERS);
  await openOrders(page);
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(cards(page)).toHaveCount(25);

  await page.getByRole('tab', { name: /^Завершённые/ }).click();

  await expect(cards(page)).toHaveCount(20);
  await expect(page.getByText('Показано 20 из 23')).toBeVisible();
  await expect.poll(() => lastListRequest(stub)?.get('cursor')).toBe('');
  await expect.poll(() => lastListRequest(stub)?.get('status')).toBe('finished');
});

test('should choose an own period in the sheet', async ({ page }) => {
  await stubMyOrders(page);
  await openOrders(page);

  await page.getByRole('button', { name: 'Период: Всё время' }).click();
  const sheet = page.getByRole('dialog', { name: 'Период' });
  await sheet.getByText('Свой период').click();
  await sheet.getByLabel('С', { exact: true }).fill(minskDay(30));
  await sheet.getByLabel('По', { exact: true }).fill(minskDay(0));
  await sheet.getByRole('button', { name: 'Показать 5 заказов' }).click();

  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?from=${minskDay(30)}&to=${minskDay(0)}`);
  await expect(cards(page)).toHaveCount(5);
  await expect(page.getByText(/Показано/)).toHaveCount(0);
});
