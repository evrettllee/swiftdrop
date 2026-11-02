import { expect, test } from '@playwright/test';
import { MANAGER_ORDERS_TEXTS } from '../src/pages/manager/orders/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastList, NEXT_CURSOR, stubManagerOrders } from './support/manager-orders';

test.use({ viewport: { width: 375, height: 844 } });

test('should show cards and add the next ones by the cursor', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  stub.total = 26;
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(20);
  await expect(page.getByText('Показано 20 из 26')).toBeVisible();
  expect(lastList(stub).get('cursor')).toBe('');
  expect(lastList(stub).get('page')).toBeNull();
  await expect(cards.first().getByText('Курьер: не назначен')).toBeVisible();
  await expect(cards.nth(1).getByText('Курьер: Павел Н.')).toBeVisible();

  await page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.SHOW_MORE }).click();

  await expect(cards).toHaveCount(26);
  expect(lastList(stub).get('cursor')).toBe(NEXT_CURSOR);
  await expect(page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.SHOW_MORE })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('should choose the sort and the filters in the sheet', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByRole('article').first()).toBeVisible();

  await page.getByRole('button', { name: /^Фильтры/ }).click();
  const sheet = page.getByRole('dialog', { name: MANAGER_ORDERS_TEXTS.FILTERS_SHEET });
  await sheet.getByText('Сначала дороже').click();
  await sheet.getByText('Не оплачен').click();
  await sheet.getByRole('button', { name: 'Показать 148 заказов' }).click();

  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/payment=unpaid&sort=price%3Adesc$/);
  await expect.poll(() => lastList(stub).get('sort')).toBe('price:desc');
  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveValue('price:desc');
});
