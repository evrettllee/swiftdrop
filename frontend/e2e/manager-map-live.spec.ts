import { expect, type Locator, type Page, test } from '@playwright/test';
import { MAP_PATH, pushCourierOnline, pushLocation, stubCouriersMap } from './support/manager-map';

const PHONE = { width: 375, height: 812 };
const BATCH_WAIT_MS = 1_000;

function mapRegion(page: Page) {
  return page.getByRole('region', { name: 'Карта курьеров на линии' });
}

function marker(page: Page, name: string): Locator {
  return mapRegion(page).getByRole('button', { name });
}

function transformOf(element: Locator): Promise<string> {
  return element.evaluate((node) => (node as HTMLElement).style.transform);
}

test('should move the marker by the position event and ignore unknown couriers', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  const pin = marker(page, 'Алина Гордей, Свободен');
  await expect(pin).toHaveCSS('transition-duration', '1s');
  const start = await transformOf(pin);
  const before = stub.requests.length;

  pushLocation(stub, 999, 53.95, 27.7);
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(await transformOf(pin)).toBe(start);

  pushLocation(stub, 1, 53.915, 27.56);
  await expect.poll(() => transformOf(pin)).not.toBe(start);
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(stub.requests).toHaveLength(before);
});

test('should bring a courier back on the line by a new position', async ({ page }) => {
  const stub = await stubCouriersMap(page);
  await page.goto(MAP_PATH);
  await expect(marker(page, 'Никита Волчек, Нет связи')).toBeVisible();

  pushLocation(stub, 4, 53.881, 27.601);
  await expect(marker(page, 'Никита Волчек, Свободен')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Состояние' }).getByRole('button')).toHaveText([
    'Все5',
    'Свободны4',
    'С заказом1',
    'Нет связи0',
  ]);
});

test('should jump without a transition when less motion is asked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  await expect(marker(page, 'Алина Гордей, Свободен')).toHaveCSS('transition-duration', '0s');
});

test('should lose the signal of a courier when the position grows older than a minute', async ({
  page,
}) => {
  await page.clock.install();
  const stub = await stubCouriersMap(page);
  stub.items = stub.items.map((item) =>
    item.courierId === 1 ? { ...item, positionAgeSec: 45 } : item,
  );
  await page.goto(MAP_PATH);

  const row = page.getByRole('region', { name: 'Курьеры на линии' }).getByRole('listitem').first();
  await expect(row).toContainText('Свободен');
  await page.clock.runFor(10_000);
  await expect(row).toContainText('Свободен');
  await page.clock.runFor(10_000);
  await expect(row).toContainText('Нет связи 1 мин');
  await expect(marker(page, 'Алина Гордей, Нет связи')).toBeVisible();
});

test('should read the list again after a courier event and keep the choice', async ({ page }) => {
  const stub = await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?courier=2`);
  const card = page.getByRole('region', { name: 'Курьер Андрей Король' });
  await expect(card).toBeVisible();
  const before = stub.requests.length;

  stub.items = stub.items.map((item) =>
    item.courierId === 2 ? { ...item, vehicleType: 'truck' } : item,
  );
  pushCourierOnline(stub, 7);
  pushCourierOnline(stub, 8);
  await expect(card).toContainText('Грузовой');
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(stub.requests).toHaveLength(before + 1);
  await expect(page).toHaveURL(/courier=2/);
});

test('should put the card under the map and the list under the card on a phone', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?courier=1`);

  const map = mapRegion(page);
  const card = page.getByRole('region', { name: 'Курьер Алина Гордей' });
  const list = page.getByRole('region', { name: 'Курьеры на линии' });
  await expect(card).toBeVisible();
  await expect(map.getByRole('region', { name: 'Курьер Алина Гордей' })).toHaveCount(0);
  const [mapBox, cardBox, listBox] = await Promise.all([
    map.boundingBox(),
    card.boundingBox(),
    list.boundingBox(),
  ]);
  expect(cardBox?.y ?? 0).toBeGreaterThan((mapBox?.y ?? 0) + (mapBox?.height ?? 0) - 1);
  expect(listBox?.y ?? 0).toBeGreaterThan((cardBox?.y ?? 0) + (cardBox?.height ?? 0) - 1);
  await expect(map.getByRole('button', { name: 'Приблизить' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
});
