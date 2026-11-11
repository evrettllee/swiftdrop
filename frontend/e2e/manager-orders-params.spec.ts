import { expect, test } from '@playwright/test';
import { FILTER_TEXTS, MANAGER_ORDERS_TEXTS } from '../src/pages/manager/orders/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastList, stubManagerOrders } from './support/manager-orders';

const SEARCH = { name: MANAGER_ORDERS_TEXTS.SEARCH_LABEL };
const CHIPS = { name: MANAGER_ORDERS_TEXTS.APPLIED_FILTERS };

test('should write the search into the address once after typing, without a history step per letter', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?status=active`);
  await expect(page.getByRole('table')).toBeVisible();
  const asked = stub.lists.length;

  await page.getByRole('searchbox', SEARCH).pressSequentially('Лис', { delay: 50 });

  await expect(page).toHaveURL(/status=active&q=%D0%9B%D0%B8%D1%81$/);
  await expect.poll(() => lastList(stub).get('q')).toBe('Лис');
  expect(stub.lists.length - asked).toBe(1);

  await page.goBack();
  await expect(page).not.toHaveURL(/status=active/);
});

test('should not send a text search shorter than three letters', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?q=%D0%9B%D0%B8`);

  await expect(page.getByText(MANAGER_ORDERS_TEXTS.SEARCH_TOO_SHORT)).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  expect(lastList(stub).get('q')).toBeNull();
});

test('should apply the filters into the address and restore them after a reload and back', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('button', { name: /^Фильтры/ }).click();
  const panel = page.getByRole('dialog', { name: MANAGER_ORDERS_TEXTS.FILTERS_PANEL });
  await panel.getByRole('combobox', { name: FILTER_TEXTS.PERIOD }).selectOption('week');
  await panel.getByRole('combobox', { name: FILTER_TEXTS.COURIER }).fill('Пав');
  await panel.getByRole('option', { name: 'Павел Новиков' }).click();
  await panel.getByText('Оплачен', { exact: true }).click();
  await panel.getByText(FILTER_TEXTS.FRAGILE_ONLY).click();
  await panel.getByRole('button', { name: 'Показать 148 заказов' }).click();

  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}&courierId=7&payment=paid&fragile=true$/);
  expect(stub.lookups.at(-1)?.searchParams.get('q')).toBe('Пав');
  await expect.poll(() => lastList(stub).get('courierId')).toBe('7');
  const query = lastList(stub);
  expect([query.get('courierId'), query.get('payment'), query.get('fragile')]).toEqual([
    '7',
    'paid',
    'true',
  ]);
  const chips = page.getByRole('group', CHIPS);
  await expect(chips.getByRole('button')).toHaveText([
    /Период:\s*7 дней/,
    /Курьер:\s*Павел Новиков/,
    /Оплата:\s*оплачен/,
    /Посылка:\s*только хрупкие/,
    MANAGER_ORDERS_TEXTS.RESET_ALL,
  ]);
  await expect(page.getByRole('button', { name: /^Фильтры/ })).toContainText('4');

  await page.reload();
  await expect(chips.getByRole('button', { name: /Курьер Павел Новиков/ })).toBeVisible();
  await expect.poll(() => lastList(stub).get('courierId')).toBe('7');

  await chips.getByRole('button', { name: /Убрать фильтр Оплата/ }).click();
  await expect(page).not.toHaveURL(/payment=/);
  await page.goBack();
  await expect(page).toHaveURL(/payment=paid/);
  await expect(chips.getByRole('button', { name: /Убрать фильтр Оплата/ })).toBeVisible();
});

test('should name a courier from the address by number while no row has them', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  stub.isEmpty = true;
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?courierId=12`);

  await expect(page.getByRole('group', CHIPS).getByText('Курьер №12')).toBeVisible();
});

test('should take the defaults in place of broken parameters of the address', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  await page.goto(
    `${APP_ROUTES.MANAGER_ORDERS}?status=lost&page=-1&limit=33&sort=name&payment=cash&from=2026-02-30`,
  );

  await expect(page.getByText('1–20 из 148')).toBeVisible();
  const query = lastList(stub);
  expect([query.get('status'), query.get('page'), query.get('limit')]).toEqual([null, '1', '20']);
  expect([query.get('sort'), query.get('payment'), query.get('from')]).toEqual([
    'createdAt:desc',
    null,
    null,
  ]);
  await expect(page.getByRole('group', CHIPS)).toHaveCount(0);
});
