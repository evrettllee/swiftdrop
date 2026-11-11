import { expect, test, type Page } from '@playwright/test';
import { EXPORT_TEXTS, MANAGER_ORDERS_TEXTS } from '../src/pages/manager/orders/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { type OrdersStub, stubManagerOrders } from './support/manager-orders';

async function openExport(page: Page, query = ''): Promise<OrdersStub> {
  const stub = await stubManagerOrders(page);
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}${query}`);
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.EXPORT, exact: true }).click();

  return stub;
}

function dialog(page: Page) {
  return page.getByRole('dialog', { name: EXPORT_TEXTS.TITLE });
}

test('should export CSV with the current list and phones under the name of the backend', async ({
  page,
}) => {
  const stub = await openExport(page, '?status=active&q=48231&payment=paid&sort=price%3Aasc');
  await expect(dialog(page).getByText('14 заказов')).toBeVisible();
  await expect(dialog(page).getByText('По текущим фильтрам: активные, оплачен')).toBeVisible();

  await dialog(page).getByText('CSV', { exact: true }).click();
  await dialog(page).getByText(EXPORT_TEXTS.WITH_PHONES).click();
  const download = page.waitForEvent('download');
  await dialog(page).getByRole('button', { name: EXPORT_TEXTS.SUBMIT }).click();

  expect((await download).suggestedFilename()).toBe('swiftdrop-orders-2026-11-02.csv');
  await expect(dialog(page)).toBeHidden();
  const query = stub.exports[0].searchParams;
  expect(Object.fromEntries(query)).toEqual({
    status: 'active',
    q: '48231',
    payment: 'paid',
    sort: 'price:asc',
    format: 'csv',
    withPhones: 'true',
  });
});

test('should export XLSX by default without phones and without pagination', async ({ page }) => {
  const stub = await openExport(page, '?page=2&limit=50');
  stub.exportAnswer = (route) =>
    route.fulfill({
      body: 'xlsx',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="orders.xlsx"; filename*=UTF-8''${encodeURIComponent('заказы.xlsx')}`,
      },
    });
  const download = page.waitForEvent('download');

  await dialog(page).getByRole('button', { name: EXPORT_TEXTS.SUBMIT }).click();

  expect((await download).suggestedFilename()).toBe('заказы.xlsx');
  const query = stub.exports[0].searchParams;
  expect([
    query.get('format'),
    query.get('withPhones'),
    query.get('page'),
    query.get('limit'),
  ]).toEqual(['xlsx', null, null, null]);
});

test('should tell the limit of rows with the total and keep the button busy meanwhile', async ({
  page,
}) => {
  const stub = await openExport(page);
  let release: () => void = () => undefined;
  stub.exportAnswer = async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({
      status: 422,
      json: {
        statusCode: 422,
        code: 'EXPORT_TOO_LARGE',
        message: 'Выгрузка ограничена 5000 строками, сузьте фильтр',
        total: 6120,
      },
    });
  };
  const submit = dialog(page).getByRole('button', { name: EXPORT_TEXTS.SUBMIT });

  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAttribute('aria-busy', 'true');
  release();

  await expect(
    dialog(page).getByText(/Выгрузка ограничена 5000 строками, сузьте фильтр/),
  ).toBeVisible();
  await expect(dialog(page).getByText(/6\s120 заказов/)).toBeVisible();
  await expect(submit).toBeEnabled();
});

test('should ask to wait a minute after too many exports', async ({ page }) => {
  const stub = await openExport(page);
  stub.exportAnswer = (route) =>
    route.fulfill({ status: 429, json: { statusCode: 429, message: 'Слишком много выгрузок' } });

  await dialog(page).getByRole('button', { name: EXPORT_TEXTS.SUBMIT }).click();

  await expect(dialog(page).getByText(EXPORT_TEXTS.TOO_MANY)).toBeVisible();
});
