import { expect, type Page, test } from '@playwright/test';
import { stubZones, zoneConflict, ZONES_PATH } from './support/manager-zones';

function table(page: Page) {
  return page.getByRole('table', { name: 'Зоны обслуживания' });
}

function polygons(page: Page) {
  return page.getByRole('region', { name: 'Карта зон обслуживания' }).locator('path.map-zone');
}

test('should list the zones and draw a polygon for each, the disabled one dashed', async ({
  page,
}) => {
  const stub = await stubZones(page);
  await page.goto(ZONES_PATH);

  const rows = table(page).getByRole('row');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(1)).toContainText('БоровляныПригород08,15 км²20 окт 2026Включена');
  await expect(rows.nth(2)).toContainText('ЗаславльПригород0');
  await expect(rows.nth(2)).toContainText('Выключена');
  await expect(rows.nth(3)).toContainText('Минск, стандарт0348,9 км²3 окт 2026');
  await expect(page.getByText('1–4 из 4')).toBeVisible();
  await expect(polygons(page)).toHaveCount(4);
  await expect(polygons(page).and(page.locator('.map-zone--off'))).toHaveCount(1);
  await expect(page.locator('.map-zone-label')).toHaveText([
    'Боровляны',
    'Заславль',
    'Минск',
    'Минск, центр',
  ]);
  expect([...stub.zoneRequests].sort((left, right) => left - right)).toEqual([1, 2, 3, 4]);
});

test('should highlight the zone chosen in the list or on the map', async ({ page }) => {
  await stubZones(page);
  await page.goto(ZONES_PATH);
  await expect(polygons(page)).toHaveCount(4);

  const borovlyany = table(page).getByRole('button', { name: 'Показать зону Боровляны на карте' });
  await borovlyany.click();
  await expect(borovlyany).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('path.map-zone--selected')).toHaveCount(1);

  await page.locator('path.map-zone--off').click();
  const zaslavl = table(page).getByRole('button', { name: 'Показать зону Заславль на карте' });
  await expect(zaslavl).toHaveAttribute('aria-pressed', 'true');
  await expect(borovlyany).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('path.map-zone--selected.map-zone--off')).toHaveCount(1);
});

test('should search by the name and hide the disabled zones', async ({ page }) => {
  await stubZones(page);
  await page.goto(ZONES_PATH);

  await page.getByRole('searchbox', { name: 'Поиск зоны' }).fill('минск');
  await expect(table(page).getByRole('row')).toHaveCount(3);
  await page.getByRole('searchbox', { name: 'Поиск зоны' }).fill('');

  await page.getByRole('switch', { name: 'Показывать выключенные' }).click();
  await expect(table(page).getByRole('row')).toHaveCount(4);
  await expect(polygons(page)).toHaveCount(3);
  await page.getByRole('searchbox', { name: 'Поиск зоны' }).fill('Лиса');
  await expect(page.getByText('По запросу «Лиса» зон нет.')).toBeVisible();
});

test('should turn a zone on at once with the time of its change', async ({ page }) => {
  const stub = await stubZones(page);
  await page.goto(ZONES_PATH);
  const before = stub.listRequests;

  await page.getByRole('switch', { name: 'Зона Заславль включена' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Зона включена' })).toBeVisible();
  expect(stub.patches).toEqual([
    { zoneId: 2, body: { isActive: true, expectedUpdatedAt: '2026-10-21T09:00:00.000Z' } },
  ]);
  await expect.poll(() => stub.listRequests).toBeGreaterThan(before);
});

test('should ask before turning a zone off', async ({ page }) => {
  const stub = await stubZones(page);
  await page.goto(ZONES_PATH);

  await page.getByRole('switch', { name: 'Зона Минск включена' }).click();
  const dialog = page.getByRole('dialog', { name: 'Выключить зону «Минск»?' });
  await expect(dialog).toContainText('Выключенная зона не принимает новые заказы.');
  await dialog.getByRole('button', { name: 'Не выключать' }).click();
  await expect(dialog).toBeHidden();
  expect(stub.patches).toEqual([]);

  await page.getByRole('switch', { name: 'Зона Минск включена' }).click();
  await dialog.getByRole('button', { name: 'Выключить' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Зона выключена' })).toBeVisible();
  expect(stub.patches).toEqual([
    { zoneId: 3, body: { isActive: false, expectedUpdatedAt: '2026-10-03T09:00:00.000Z' } },
  ]);
});

test('should tell why the last active zone cannot be turned off', async ({ page }) => {
  const stub = await stubZones(page);
  stub.failure = zoneConflict('LAST_ACTIVE_ZONE');
  await page.goto(ZONES_PATH);

  await page.getByRole('switch', { name: 'Зона Боровляны включена' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Выключить' }).click();
  await expect(page.getByText('Нельзя выключить последнюю активную зону')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Зона Боровляны включена' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
