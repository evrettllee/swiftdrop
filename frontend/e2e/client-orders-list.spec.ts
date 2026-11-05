import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastListRequest, minskDay, stubMyOrders } from './support/my-orders';

function tab(page: Page, name: string) {
  return page.getByRole('tab', { name: new RegExp(`^${name}`) });
}

function cards(page: Page) {
  return page.getByRole('tabpanel').getByRole('link', { name: /^№/ });
}

function chips(page: Page) {
  return page.getByRole('group', { name: 'Применённые фильтры' });
}

async function openOrders(page: Page, search = '') {
  await page.goto(`${APP_ROUTES.ORDERS}${search}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Мои заказы' })).toBeVisible();
}

test('should count the orders of each tab and keep the tab in the address', async ({ page }) => {
  const stub = await stubMyOrders(page);
  await openOrders(page);

  await expect(tab(page, 'Активные')).toContainText('1');
  await expect(tab(page, 'Завершённые')).toContainText('6');
  await expect(tab(page, 'Отменённые')).toContainText('1');
  await expect(tab(page, 'Все')).toContainText('8');
  await expect(tab(page, 'Все')).toHaveAttribute('aria-selected', 'true');
  await expect(cards(page)).toHaveCount(5);

  await tab(page, 'Отменённые').click();
  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?status=cancelled`);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('48090');
  await expect(cards(page).first()).toContainText('Не назначен');
  await expect.poll(() => lastListRequest(stub)?.get('status')).toBe('cancelled');

  await page.reload();
  await expect(tab(page, 'Отменённые')).toHaveAttribute('aria-selected', 'true');

  await tab(page, 'Все').click();
  await expect(page).toHaveURL(APP_ROUTES.ORDERS);
  await expect(cards(page).first()).toContainText('Дмитрий С.');
});

test('should search by the number and the street and keep it after a reload', async ({ page }) => {
  const stub = await stubMyOrders(page);
  await openOrders(page);

  await page.getByRole('searchbox', { name: 'Поиск заказов' }).fill('Немига');
  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?q=${encodeURIComponent('Немига')}`);
  await expect(cards(page)).toHaveCount(2);
  await expect(tab(page, 'Все')).toContainText('2');
  await expect.poll(() => lastListRequest(stub)?.get('q')).toBe('Немига');

  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Поиск заказов' })).toHaveValue('Немига');
  await expect(cards(page)).toHaveCount(2);

  await page.getByRole('searchbox', { name: 'Поиск заказов' }).fill('48156');
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('48156');

  await chips(page).getByRole('button', { name: 'Убрать фильтр Поиск 48156' }).click();
  await expect(page).toHaveURL(APP_ROUTES.ORDERS);
  await expect(cards(page)).toHaveCount(5);
});

test('should choose a period and an own period, keep them in the address and go back', async ({
  page,
}) => {
  await stubMyOrders(page);
  await openOrders(page);

  await page.getByRole('button', { name: 'Период: Всё время' }).click();
  const panel = page.getByRole('dialog', { name: 'Период' });
  await panel.getByText('Последние 7 дней', { exact: true }).click();
  await panel.getByRole('button', { name: 'Показать 2 заказа' }).click();

  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?from=${minskDay(6)}`);
  await expect(chips(page)).toContainText('Период:7 дней');
  await expect(cards(page)).toHaveCount(2);

  await page.getByRole('button', { name: 'Период: Последние 7 дней' }).click();
  await panel.getByText('Свой период', { exact: true }).click();
  await panel.getByLabel('С', { exact: true }).fill(minskDay(30));
  await panel.getByLabel('По', { exact: true }).fill(minskDay(10));
  await panel.getByRole('button', { name: 'Показать 3 заказа' }).click();

  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?from=${minskDay(30)}&to=${minskDay(10)}`);
  await expect(cards(page)).toHaveCount(3);

  await page.goBack();
  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?from=${minskDay(6)}`);
  await expect(page.getByRole('button', { name: 'Период: Последние 7 дней' })).toBeVisible();

  await page.reload();
  await expect(chips(page)).toContainText('Период:7 дней');
  await chips(page).getByRole('button', { name: 'Сбросить всё' }).click();
  await expect(page).toHaveURL(APP_ROUTES.ORDERS);
});

test('should refuse an own period that ends before it starts', async ({ page }) => {
  await stubMyOrders(page);
  await openOrders(page);

  await page.getByRole('button', { name: 'Период: Всё время' }).click();
  const panel = page.getByRole('dialog', { name: 'Период' });
  await panel.getByText('Свой период', { exact: true }).click();
  await panel.getByLabel('С', { exact: true }).fill(minskDay(1));
  await panel.getByLabel('По', { exact: true }).fill(minskDay(10));

  await expect(panel.getByText('Начало периода позже его конца')).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Показать/ })).toBeDisabled();
});

test('should sort by the price and keep the sort after a reload', async ({ page }) => {
  const stub = await stubMyOrders(page);
  await openOrders(page);

  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('Сначала дешевле');
  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?sort=price%3Aasc`);
  await expect(cards(page).first()).toContainText('47980');
  await expect.poll(() => lastListRequest(stub)?.get('sort')).toBe('price:asc');

  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveValue('price:asc');

  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('Сначала новые');
  await expect(page).toHaveURL(APP_ROUTES.ORDERS);
  await expect.poll(() => lastListRequest(stub)?.has('sort')).toBe(false);
});

test('should turn an old link with the filter into the status', async ({ page }) => {
  const stub = await stubMyOrders(page);
  await openOrders(page, '?filter=active');

  await expect(page).toHaveURL(`${APP_ROUTES.ORDERS}?status=active`);
  await expect(tab(page, 'Активные')).toHaveAttribute('aria-selected', 'true');
  await expect(cards(page)).toHaveCount(1);
  expect(stub.requests.every((params) => !params.has('filter'))).toBe(true);
});

test('should offer a new order to a client without orders', async ({ page }) => {
  await stubMyOrders(page, []);
  await openOrders(page);

  await expect(page.getByRole('heading', { name: 'Заказов пока нет' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Новый заказ' })).toBeVisible();
  await expect(page.getByRole('tablist')).toHaveCount(0);
});

test('should tell that nothing is found and reset it with the chips', async ({ page }) => {
  await stubMyOrders(page);
  await openOrders(page, `?q=${encodeURIComponent('Ленина')}`);

  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(0);

  await chips(page).getByRole('button', { name: 'Сбросить всё' }).click();
  await expect(cards(page)).toHaveCount(5);
});
