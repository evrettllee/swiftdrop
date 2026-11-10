import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { openCourierHistory } from './support/courier-history-page';
import { stubManagerOrders } from './support/manager-orders';
import { stubMyOrders } from './support/my-orders';

test.use({ viewport: { width: 375, height: 812 } });

function sortOptions(page: Page) {
  return page.getByRole('combobox', { name: 'Сортировка' }).locator('option');
}

async function fullLabels(page: Page): Promise<(string | null)[]> {
  return sortOptions(page).evaluateAll((options) =>
    options.map((option) => option.getAttribute('aria-label')),
  );
}

test('should name the sorts of the courier history shortly on a phone', async ({ page }) => {
  await openCourierHistory(page);

  await expect(sortOptions(page)).toHaveText(['Новые', 'Старые', 'Дальние', 'Ближние']);
  expect(await fullLabels(page)).toEqual([
    'Сначала новые',
    'Сначала старые',
    'Сначала дальние',
    'Сначала ближние',
  ]);
});

test('should name the sorts of the client orders shortly on a phone', async ({ page }) => {
  await stubMyOrders(page);
  await page.goto(APP_ROUTES.ORDERS);

  await expect(sortOptions(page)).toHaveText(['Новые', 'Старые', 'Дороже', 'Дешевле']);
  expect(await fullLabels(page)).toEqual([
    'Сначала новые',
    'Сначала старые',
    'Сначала дороже',
    'Сначала дешевле',
  ]);
});

test('should name the sorts of the manager orders shortly on a phone', async ({ page }) => {
  await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  await expect(sortOptions(page)).toHaveText([
    'Новые',
    'Старые',
    'Дороже',
    'Дешевле',
    'Без изменений',
    'Изменённые',
  ]);

  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?status=attention`);
  await expect(sortOptions(page)).toHaveText(['Дольше ждёт', 'Недавние']);
  expect(await fullLabels(page)).toEqual(['Дольше всего ждёт', 'Недавно появились']);
});
