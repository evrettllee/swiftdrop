import { expect, test } from '@playwright/test';
import { ANALYTICS_PATH, COURIERS_PATH, stubAnalytics } from './support/manager-analytics';

test('should sort the couriers by a click on a column and turn the pages', async ({ page }) => {
  const stub = await stubAnalytics(page);
  await page.goto(COURIERS_PATH);

  const table = page.getByRole('table', { name: 'Курьеры за период' });
  await expect(table.getByRole('row')).toHaveCount(21);
  await expect(page.getByText('1–20 из 23')).toBeVisible();
  expect(stub.couriers.at(-1)?.get('limit')).toBe('20');

  await table.getByRole('button', { name: 'Вовремя' }).click();
  await expect(page).toHaveURL(`${COURIERS_PATH}?sort=onTimePct%3Adesc`);
  await expect(table.getByRole('columnheader', { name: 'Вовремя' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expect(table.getByRole('row').nth(1)).toContainText('Алина Гордей');
  expect(stub.couriers.at(-1)?.get('sort')).toBe('onTimePct:desc');

  await table.getByRole('button', { name: 'Вовремя' }).click();
  await expect(table.getByRole('columnheader', { name: 'Вовремя' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  expect(stub.couriers.at(-1)?.get('sort')).toBe('onTimePct:asc');

  await page.getByRole('button', { name: 'Следующая страница' }).click();
  await expect(page).toHaveURL(`${COURIERS_PATH}?sort=onTimePct%3Aasc&page=2`);
  await expect(table.getByRole('row')).toHaveCount(4);
  await expect(page.getByText('21–23 из 23')).toBeVisible();
  expect(stub.couriers.at(-1)?.get('page')).toBe('2');

  await table.getByRole('button', { name: 'Курьер' }).click();
  await expect(page).toHaveURL(`${COURIERS_PATH}?sort=name%3Aasc`);
  await expect(table.getByRole('row').nth(1)).toContainText('Алина Гордей');
});

test('should keep the period on the way back to the analytics', async ({ page }) => {
  await stubAnalytics(page);
  await page.goto(`${COURIERS_PATH}?period=90d&page=2`);
  await expect(page.getByText(/^29 июля – 26 октября/)).toBeVisible();

  await page.getByRole('combobox', { name: 'Период' }).selectOption('30d');
  await expect(page).toHaveURL(`${COURIERS_PATH}?period=30d`);
  await page
    .getByRole('navigation', { name: 'Навигация по разделу' })
    .getByRole('link', {
      name: 'Аналитика',
    })
    .click();
  await expect(page).toHaveURL(`${ANALYTICS_PATH}?period=30d`);
});
