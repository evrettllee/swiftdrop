import { expect, test } from '@playwright/test';
import { ANALYTICS_PATH, cardLines, periodOf, stubAnalytics } from './support/manager-analytics';

const NBSP = ' ';

test('should show the cards of the last 7 days with their notes', async ({ page }) => {
  const stub = await stubAnalytics(page);
  await page.goto(ANALYTICS_PATH);

  await expect(page.getByRole('heading', { level: 1, name: 'Аналитика' })).toBeVisible();
  await expect(page.getByText('20–26 октября, сравнение с 13–19 октября')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Период' })).toHaveValue('7d');
  expect(periodOf(stub.summaries[0])).toBe('2026-10-20..2026-10-26');
  expect(new Set(stub.summaries.map(periodOf))).toEqual(new Set(['2026-10-20..2026-10-26']));

  const lines = (id: string) => expect.poll(() => cardLines(page, id));
  await lines('delivered').toEqual([
    'Доставлено',
    '289',
    'из 312 оформленных, +8% к прошлому периоду',
  ]);
  await lines('onTime').toEqual(['Вовремя', '91%', '263 заказа к обещанному времени или раньше']);
  await lines('avgDeliveryMin').toEqual([
    'Среднее время доставки',
    '34 мин',
    'от оплаты до вручения, было 37 мин',
  ]);
  await lines('cancelled').toEqual([
    'Отменено',
    '4,2%',
    '13 заказов: 9 клиентом, 3 системой, 1 сотрудником',
  ]);
  await lines('revenue').toEqual([
    'Выручка',
    `3${NBSP}184 BYN`,
    'средний чек 11,02 BYN, без возвратов',
  ]);
  await lines('courierSearch').toEqual([
    'Поиск курьера',
    '1 мин 48 с',
    'в среднем, вручную назначено 6 заказов (2%)',
  ]);
  await expect(page).toHaveURL(ANALYTICS_PATH);
});

test('should draw the stacked days and the hours with a summary and a tip', async ({ page }) => {
  await stubAnalytics(page);
  await page.goto(ANALYTICS_PATH);

  const days = page.getByRole('figure', { name: /^Заказы по дням:/ });
  await expect(days).toHaveAccessibleName(
    /^Заказы по дням: 20 октября доставлено 36, отменено 2; .*26 октября доставлено 22, отменено 0, в работе 10$/,
  );
  const bars = days.getByRole('img');
  await expect(bars).toHaveCount(7);
  await expect(days.getByText('20 окт', { exact: true })).toBeVisible();
  await expect(days.getByText('58', { exact: true })).toBeVisible();
  await expect(bars.nth(6).locator('[data-segment]')).toHaveCount(2);
  await expect(bars.nth(6).locator('[data-segment="progress"]')).toBeVisible();
  await expect(days.getByText('60', { exact: true })).toBeVisible();
  await expect(days.getByText('45', { exact: true })).toBeVisible();

  await bars.nth(4).hover();
  const tip = days.locator('[data-chart-tip]');
  await expect(tip).toHaveText('24 октябряДоставлены: 55Отменены: 3В работе: 0');
  await page.mouse.move(0, 0);
  await expect(tip).toHaveCount(0);

  await bars.first().focus();
  await expect(tip).toContainText('20 октября');
  await page.keyboard.press('End');
  await expect(bars.nth(6)).toBeFocused();
  await expect(tip).toHaveText('26 октябряДоставлены: 22Отменены: 0В работе: 10');

  const hours = page.getByRole('figure', { name: /^Нагрузка по часам:/ });
  await expect(hours).toHaveAccessibleName(
    'Нагрузка по часам: пик в 18 часов, 5,1 заказа в час; меньше всего в 8 часов, 0,9',
  );
  await expect(hours.getByRole('img')).toHaveCount(15);
  await hours.getByRole('img').nth(10).hover();
  await expect(hours.locator('[data-chart-tip]')).toHaveText('18:005,1 заказа в час');
});

test('should list the top 5 couriers and open all of them for the same period', async ({
  page,
}) => {
  const stub = await stubAnalytics(page);
  await page.goto(`${ANALYTICS_PATH}?period=30d`);

  const table = page.getByRole('table', { name: 'Курьеры за период' });
  await expect(table.getByRole('row')).toHaveCount(6);
  await expect(table.getByRole('row').nth(1)).toHaveText('Дмитрий СоколовЛегковой4693%31 мин238');
  await expect(table.getByRole('columnheader', { name: 'Доставок' })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  const [top] = stub.couriers;
  expect([top.get('sort'), top.get('limit'), top.get('page')]).toEqual([
    'delivered:desc',
    '5',
    '1',
  ]);
  expect(periodOf(top)).toBe('2026-09-27..2026-10-26');

  await page.getByRole('link', { name: 'Все курьеры' }).click();
  await expect(page).toHaveURL('/manager/analytics/couriers?period=30d');
  await expect(page.getByRole('heading', { level: 1, name: 'Курьеры' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Период' })).toHaveValue('30d');
  expect(periodOf(stub.couriers.at(-1))).toBe('2026-09-27..2026-10-26');
});
