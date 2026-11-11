import { expect, type Page, test } from '@playwright/test';
import {
  ANALYTICS_PATH,
  cardLines,
  COURIERS_PATH,
  stubAnalytics,
} from './support/manager-analytics';

test.use({ viewport: { width: 375, height: 812 } });

async function shownLabels(page: Page, name: RegExp): Promise<string[]> {
  const texts = await page
    .getByRole('figure', { name })
    .locator('[aria-hidden="true"]')
    .last()
    .locator('span')
    .allTextContents();

  return texts.filter((text) => text !== '');
}

test('should put the cards in two columns with the short notes of the phone', async ({ page }) => {
  await stubAnalytics(page);
  await page.goto(ANALYTICS_PATH);

  const cards = page.getByRole('region', { name: 'Ключевые показатели' });
  const card = (id: string) => cards.locator(`[data-kpi="${id}"]`);
  const lines = (id: string) => expect.poll(() => cardLines(page, id));
  await lines('delivered').toEqual(['Доставлено', '289', 'из 312, +8% к прошлому периоду']);
  await lines('onTime').toEqual(['Вовремя', '91%', '263 к обещанному']);
  await lines('avgDeliveryMin').toEqual(['Время доставки', '34 мин', 'было 37 мин']);
  await lines('cancelled').toEqual(['Отменено', '4,2%', '13 заказов']);
  await lines('revenue').toEqual(['Выручка', '3 184 BYN', 'чек 11,02 BYN']);
  await lines('courierSearch').toEqual(['Поиск курьера', '1:48', 'мин:с, вручную 2%']);

  const [first, second, third] = await Promise.all(
    ['delivered', 'onTime', 'avgDeliveryMin'].map((id) => card(id).boundingBox()),
  );
  expect(first?.y).toBe(second?.y);
  expect(second?.x ?? 0).toBeGreaterThan(first?.x ?? 0);
  expect(third?.y ?? 0).toBeGreaterThan(first?.y ?? 0);

  expect(await shownLabels(page, /^Заказы по дням:/)).toEqual([
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
  ]);
  expect(await shownLabels(page, /^Нагрузка по часам:/)).toEqual([
    '8',
    '10',
    '12',
    '14',
    '16',
    '18',
    '20',
    '22',
  ]);

  const list = page.getByRole('list', { name: 'Курьеры за период' });
  await expect(list.getByRole('listitem')).toHaveCount(5);
  await expect(list.getByRole('listitem').first()).toHaveText(
    'Дмитрий СоколовЛегковой46 доставокВовремя 93%В среднем 31 минОтказы 2На линии 38 ч',
  );
  await expect(page.getByRole('table')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('should thin out the dates of 90 days on a phone', async ({ page }) => {
  await stubAnalytics(page);
  await page.goto(`${ANALYTICS_PATH}?period=90d`);

  const days = page.getByRole('figure', { name: /^Заказы по дням:/ });
  await expect(days.getByRole('img')).toHaveCount(90);
  const labels = await shownLabels(page, /^Заказы по дням:/);
  expect(labels.length).toBeLessThanOrEqual(7);
  expect(labels[0]).toBe('29');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('should sort the full list of couriers with a select on a phone', async ({ page }) => {
  const stub = await stubAnalytics(page);
  await page.goto(COURIERS_PATH);

  await expect(page.getByRole('link', { name: 'Аналитика' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('name:asc');
  await expect(page).toHaveURL(`${COURIERS_PATH}?sort=name%3Aasc`);
  const list = page.getByRole('list', { name: 'Курьеры за период' });
  await expect(list.getByRole('listitem').first()).toContainText('Алина Гордей');
  await expect(list.getByRole('listitem')).toHaveCount(20);
  expect(stub.couriers.at(-1)?.get('sort')).toBe('name:asc');
  await expect(page.getByText('1–20 из 23')).toBeVisible();
});
