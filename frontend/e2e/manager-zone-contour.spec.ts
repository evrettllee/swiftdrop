import { expect, type Page, test } from '@playwright/test';
import { drawMap, drawSquare, NEW_ZONE_PATH, stubZoneDraw } from './support/manager-zone-draw';
import { updateZone, zoneConflict } from './support/manager-zones';

const CONTOUR_PATH = '/manager/zones/4/contour';
const VERTEX = '.marker-icon:not(.marker-icon-middle)';

async function dragFirstVertex(page: Page, dx: number, dy: number): Promise<void> {
  const box = await drawMap(page).locator(VERTEX).first().boundingBox();
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 6 });
  await page.mouse.up();
}

test('should save only the moved border with the time of the loaded zone', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(CONTOUR_PATH);

  await expect(page.getByText('Минск, центр', { exact: true })).toBeVisible();
  await expect(drawMap(page).locator('path.map-zone--ghost')).toHaveCount(3);
  await expect(drawMap(page).locator(VERTEX)).toHaveCount(4);
  await dragFirstVertex(page, -30, 20);
  await page.getByRole('button', { name: 'Сохранить границу' }).click();

  await expect(page).toHaveURL('/manager/zones');
  await expect(page.getByRole('status').filter({ hasText: 'Граница сохранена' })).toBeVisible();
  const { body } = stub.zones.patches[0];
  expect(Object.keys(body).sort()).toEqual(['expectedUpdatedAt', 'polygon']);
  expect(body.expectedUpdatedAt).toBe('2026-10-12T09:00:00.000Z');
  const [ring] = body.polygon as number[][][];
  expect(ring).toHaveLength(5);
  expect(ring[0]).not.toEqual([27.52, 53.92]);
  expect(ring[4]).toEqual(ring[0]);
});

test('should read the border again after it was changed by someone else', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(CONTOUR_PATH);
  await expect(drawMap(page).locator(VERTEX)).toHaveCount(4);
  stub.zones.failure = zoneConflict('ZONE_CHANGED');
  await dragFirstVertex(page, -30, 20);
  await page.getByRole('button', { name: 'Сохранить границу' }).click();
  await expect(
    page.getByText('Зону уже изменили. Обновите, чтобы увидеть новые данные'),
  ).toBeVisible();

  stub.zones.failure = null;
  updateZone(stub.zones, 4, { updatedAt: '2026-10-30T09:00:00.000Z' });
  const asked = stub.zones.zoneRequests.length;
  await page.getByRole('button', { name: 'Обновить' }).click();
  await expect.poll(() => stub.zones.zoneRequests.length).toBeGreaterThan(asked);
  await expect(page.getByText('Зону уже изменили')).toHaveCount(0);
  await dragFirstVertex(page, -20, 10);
  await page.getByRole('button', { name: 'Сохранить границу' }).click();
  await expect(page).toHaveURL('/manager/zones');
  expect(stub.zones.patches.at(-1)?.body.expectedUpdatedAt).toBe('2026-10-30T09:00:00.000Z');
});

test('should ask before leaving a drawn zone and leave an untouched one at once', async ({
  page,
}) => {
  await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(page).toHaveURL('/manager/zones');

  await page.goto(NEW_ZONE_PATH);
  await drawSquare(page);
  const dialog = page.getByRole('dialog', { name: 'Уйти со страницы?' });
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(dialog).toContainText('Несохранённые изменения пропадут.');
  await dialog.getByRole('button', { name: 'Остаться' }).click();
  await expect(page).toHaveURL(NEW_ZONE_PATH);
  await expect(drawMap(page).locator('path.map-zone--draft')).toHaveCount(1);

  await page
    .getByRole('navigation', { name: 'Навигация' })
    .getByRole('link', { name: 'Зоны' })
    .click();
  await dialog.getByRole('button', { name: 'Уйти' }).click();
  await expect(page).toHaveURL('/manager/zones');
});

test('should put the tools above the map and the form under it on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);

  const toolbar = page.getByRole('toolbar', { name: 'Инструменты рисования' });
  await expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(page.getByRole('heading', { name: 'Параметры зоны' })).toBeHidden();
  await page.getByRole('button', { name: 'Многоугольник' }).click();
  await expect(page.getByText('Касайтесь карты, замкните на первой точке')).toBeVisible();
  const [tools, map, name] = await Promise.all([
    toolbar.boundingBox(),
    drawMap(page).boundingBox(),
    page.getByRole('textbox', { name: 'Название' }).boundingBox(),
  ]);
  expect(tools?.y ?? 0).toBeLessThan(map?.y ?? 0);
  expect(name?.y ?? 0).toBeGreaterThan((map?.y ?? 0) + (map?.height ?? 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
