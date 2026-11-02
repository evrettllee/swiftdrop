import { expect, test } from '@playwright/test';
import { MANAGER_ORDERS_TEXTS } from '../src/pages/manager/orders/config/texts';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { LIST_UNTIL, lastList, stubManagerOrders } from './support/manager-orders';

const TABLE = { name: MANAGER_ORDERS_TEXTS.TABLE_LABEL };

test('should show the counts of the tabs and switch the tab through the address', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  const tabs = page.getByRole('tablist', { name: MANAGER_ORDERS_TEXTS.TABS_LABEL });
  await expect(tabs.getByRole('tab', { name: /^Все\s*148$/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(tabs.getByRole('tab', { name: /^Требуют внимания\s*3$/ })).toBeVisible();
  await expect(page.getByRole('table', TABLE).getByRole('row')).toHaveCount(21);
  expect(lastList(stub).get('status')).toBeNull();

  stub.status = ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
  await tabs.getByRole('tab', { name: /^Требуют внимания\s*3$/ }).click();

  await expect(page).toHaveURL(/\?status=attention$/);
  await expect(page.getByRole('columnheader', { name: 'Ждёт назначения' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Курьер' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveValue(
    'statusChangedAt:asc',
  );
  await expect.poll(() => lastList(stub).get('status')).toBe('attention');
  expect(lastList(stub).get('sort')).toBe('statusChangedAt:asc');
  await expect(
    page
      .getByRole('table', TABLE)
      .getByText(/^3[45] мин$/)
      .first(),
  ).toBeVisible();
});

test('should sort, page and size the table and keep the bound of the list', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByText('1–20 из 148')).toBeVisible();
  expect(lastList(stub).get('until')).toBeNull();

  await page.getByRole('button', { name: 'Следующая страница' }).click();

  await expect(page).toHaveURL(/\?page=2$/);
  await expect.poll(() => lastList(stub).get('page')).toBe('2');
  await expect(page.getByText('21–40 из 148')).toBeVisible();
  expect(lastList(stub).get('until')).toBe(String(LIST_UNTIL));

  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('price:desc');

  await expect(page).toHaveURL(/\?sort=price%3Adesc$/);
  await expect.poll(() => lastList(stub).get('sort')).toBe('price:desc');
  expect(lastList(stub).get('page')).toBe('1');
  expect(lastList(stub).get('until')).toBeNull();
  await expect(page.getByRole('columnheader', { name: 'Сумма' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );

  await page.getByRole('combobox', { name: MANAGER_ORDERS_TEXTS.PAGE_SIZE }).selectOption('50');

  await expect(page).toHaveURL(/sort=price%3Adesc&limit=50$/);
  await expect(page.getByText('1–50 из 148')).toBeVisible();
  await expect(page.getByText('Страница 1 из 3')).toBeVisible();
});

test('should open the order from its row and from the menu of the row', async ({ page }) => {
  await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  await page.getByRole('button', { name: 'Действия с заказом №48235' }).click();
  await page.getByRole('link', { name: MANAGER_ORDERS_TEXTS.OPEN_ORDER }).click();
  await expect(page).toHaveURL('/manager/orders/48235');

  await page.goBack();
  await page.getByRole('link', { name: '№48236' }).click();
  await expect(page).toHaveURL('/manager/orders/48236');
});

test('should explain an empty result without a button and reset the filters by the chips', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  stub.isEmpty = true;
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?q=48299&fragile=true`);

  await expect(page.getByRole('heading', { name: MANAGER_ORDERS_TEXTS.EMPTY_TITLE })).toBeVisible();
  await expect(
    page.getByText('По номеру «48299» заказов нет. Проверьте номер или измените фильтры.'),
  ).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('button', { name: /Повторить|Показать/ }),
  ).toHaveCount(0);

  stub.isEmpty = false;
  await page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.RESET_ALL }).click();

  await expect(page).toHaveURL(/\?q=48299$/);
  await expect(page.getByRole('group', { name: MANAGER_ORDERS_TEXTS.APPLIED_FILTERS })).toHaveCount(
    0,
  );
});
