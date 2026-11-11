import { expect, test } from '@playwright/test';
import {
  CREATED_ZONE_ID,
  clickAt,
  drawMap,
  drawSquare,
  NEW_ZONE_PATH,
  ringOf,
  stubZoneDraw,
} from './support/manager-zone-draw';
import { zoneConflict } from './support/manager-zones';

test('should draw a polygon by clicks and create the zone with a closed ring', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await expect(drawMap(page).locator('path.map-zone--ghost')).toHaveCount(4);
  await expect(
    page.getByRole('status').filter({ hasText: 'Выберите многоугольник' }),
  ).toBeVisible();

  await drawSquare(page);
  await expect(page.getByText('Тяните вершины. Точка на ребре добавит новую')).toBeVisible();
  await page.getByRole('textbox', { name: 'Название' }).fill(' Каменная Горка ');
  await page.getByRole('textbox', { name: 'Приоритет' }).fill('5');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();

  await expect(page).toHaveURL('/manager/zones');
  await expect(page.getByRole('status').filter({ hasText: 'Зона создана' })).toBeVisible();
  const [body] = stub.posts;
  expect(body).toMatchObject({ name: 'Каменная Горка', tariffId: 1, priority: 5, isActive: true });
  const ring = ringOf(body);
  expect(ring).toHaveLength(5);
  expect(ring[4]).toEqual(ring[0]);
  expect(ring[0][0]).toBeLessThan(ring[1][0]);
  expect(ring[0][1]).toBeGreaterThan(ring[2][1]);
  expect(CREATED_ZONE_ID).toBe(9);
});

test('should take back the last vertex, then the shape, and clear the map', async ({ page }) => {
  await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  const undo = page.getByRole('button', { name: 'Отменить' });
  await expect(undo).toBeDisabled();

  await page.getByRole('button', { name: 'Многоугольник' }).click();
  await clickAt(page, 0.2, 0.75);
  await clickAt(page, 0.3, 0.75);
  await expect(drawMap(page).locator('.marker-icon:not(.marker-icon-middle)')).toHaveCount(3);
  await undo.click();
  await expect(drawMap(page).locator('.marker-icon:not(.marker-icon-middle)')).toHaveCount(2);
  await undo.click();
  await expect(undo).toBeDisabled();
  await page.getByRole('button', { name: 'Многоугольник' }).click();

  await drawSquare(page);
  await expect(drawMap(page).locator('path.map-zone--draft')).toHaveCount(1);
  await page.getByRole('button', { name: 'Стереть' }).click();
  await expect(drawMap(page).locator('path.map-zone--draft')).toHaveCount(0);
  await undo.click();
  await expect(drawMap(page).locator('path.map-zone--draft')).toHaveCount(1);
});

test('should keep the name taken by another zone under the field', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  stub.failure = zoneConflict('ZONE_NAME_TAKEN');
  await page.goto(NEW_ZONE_PATH);

  await drawSquare(page);
  await page.getByRole('textbox', { name: 'Название' }).fill('Минск');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page.getByRole('textbox', { name: 'Название' })).toHaveAccessibleDescription(
    'Зона с таким названием уже есть',
  );
  await expect(page).toHaveURL(NEW_ZONE_PATH);
});
