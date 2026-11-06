import { expect, type Page, test } from '@playwright/test';
import { MANAGER_ORDERS_TEXTS } from '../src/pages/manager/orders/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastList, stubManagerOrders } from './support/manager-orders';

test.use({ viewport: { width: 1440, height: 1000 } });

function header(page: Page, name: string) {
  return page.getByRole('columnheader', { name, exact: true });
}

function sortSelect(page: Page) {
  return page.getByRole('combobox', { name: MANAGER_ORDERS_TEXTS.SORT });
}

test('should offer six sorts and two on the tab of the orders that need attention', async ({
  page,
}) => {
  await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  await expect(sortSelect(page).getByRole('option')).toHaveText([
    'Сначала новые',
    'Сначала старые',
    'Сначала дороже',
    'Сначала дешевле',
    'Дольше без изменений',
    'Недавно изменённые',
  ]);

  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?status=attention`);
  await expect(sortSelect(page).getByRole('option')).toHaveText([
    'Дольше всего ждёт',
    'Недавно появились',
  ]);
  await expect(sortSelect(page)).toHaveValue('statusChangedAt:asc');
  await expect(header(page, MANAGER_ORDERS_TEXTS.COLUMN_ORDER).getByRole('button')).toHaveCount(0);
});

test('should sort by the headers through the same sort in the address', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  const order = header(page, MANAGER_ORDERS_TEXTS.COLUMN_ORDER);
  const sum = header(page, MANAGER_ORDERS_TEXTS.COLUMN_SUM);

  await expect(order).toHaveAttribute('aria-sort', 'descending');
  await expect(header(page, MANAGER_ORDERS_TEXTS.COLUMN_CLIENT).getByRole('button')).toHaveCount(0);

  await sum.getByRole('button').click();
  await expect(page).toHaveURL(`${APP_ROUTES.MANAGER_ORDERS}?sort=price%3Adesc`);
  await expect(sum).toHaveAttribute('aria-sort', 'descending');
  await expect(order).not.toHaveAttribute('aria-sort');
  await expect.poll(() => lastList(stub).get('sort')).toBe('price:desc');

  await sum.getByRole('button').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`${APP_ROUTES.MANAGER_ORDERS}?sort=price%3Aasc`);
  await expect(sum).toHaveAttribute('aria-sort', 'ascending');
  await expect(sortSelect(page)).toHaveValue('price:asc');

  await sortSelect(page).selectOption('Сначала старые');
  await expect(order).toHaveAttribute('aria-sort', 'ascending');

  await order.getByRole('button').click();
  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ORDERS);
  await expect(order).toHaveAttribute('aria-sort', 'descending');
});

test('should flip the waiting time by its header on the tab of the orders that need attention', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  const route = `${APP_ROUTES.MANAGER_ORDERS}?status=attention`;
  await page.goto(route);
  const waiting = header(page, MANAGER_ORDERS_TEXTS.COLUMN_WAITING);

  await expect(waiting).toHaveAttribute('aria-sort', 'ascending');

  await waiting.getByRole('button').click();
  await expect(page).toHaveURL(`${route}&sort=statusChangedAt%3Adesc`);
  await expect(waiting).toHaveAttribute('aria-sort', 'descending');
  await expect(sortSelect(page)).toHaveValue('statusChangedAt:desc');
  await expect.poll(() => lastList(stub).get('sort')).toBe('statusChangedAt:desc');

  await waiting.getByRole('button').click();
  await expect(page).toHaveURL(route);
  await expect(waiting).toHaveAttribute('aria-sort', 'ascending');
});
