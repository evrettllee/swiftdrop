import { expect, test } from '@playwright/test';
import { clickAt, drawMap, NEW_ZONE_PATH, ringOf, stubZoneDraw } from './support/manager-zone-draw';

const VERTEX = '.marker-icon:not(.marker-icon-middle)';

async function drawCircle(page: Parameters<typeof clickAt>[0]) {
  await page.getByRole('button', { name: 'Круг' }).click();
  await expect(
    page.getByText('Кликните в центр, затем тяните край или введите радиус'),
  ).toBeVisible();
  await clickAt(page, 0.25, 0.8);
  await clickAt(page, 0.3, 0.8);
}

test('should draw a circle, set the radius in the field and save it as 64 points', async ({
  page,
}) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);

  await drawCircle(page);
  const radius = page.getByRole('textbox', { name: 'Радиус, км' });
  await expect(radius).toBeVisible();
  await expect(page.getByText('Или тяните край круга на карте.')).toBeVisible();
  await radius.fill('3');
  await expect(drawMap(page).locator('.zone-draw__radius-label')).toHaveText('3,0 км');
  await radius.fill('70');
  await expect(page.getByText('Радиус: от 0,1 до 50 км')).toBeVisible();
  await expect(drawMap(page).locator('.zone-draw__radius-label')).toHaveText('3,0 км');
  await radius.fill('2,5');
  await expect(drawMap(page).locator('.zone-draw__radius-label')).toHaveText('2,5 км');

  await page.getByRole('textbox', { name: 'Название' }).fill('Боровляны, юг');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page).toHaveURL('/manager/zones');
  const ring = ringOf(stub.posts[0]);
  expect(ring).toHaveLength(65);
  expect(ring[64]).toEqual(ring[0]);
  const center = ring
    .slice(0, 64)
    .reduce(([x, y], [lng, lat]) => [x + lng / 64, y + lat / 64], [0, 0]);
  expect((ring[16][1] - center[1]) * 110.574).toBeCloseTo(2.5, 3);
});

test('should turn the circle into points that can be edited one by one', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);

  await drawCircle(page);
  await expect(drawMap(page).locator(VERTEX)).toHaveCount(2);
  await page.getByRole('button', { name: 'Править по точкам' }).click();
  await expect(page.getByRole('textbox', { name: 'Радиус, км' })).toHaveCount(0);
  await expect(drawMap(page).locator(VERTEX)).toHaveCount(64);
  await expect(page.getByText('Тяните вершины. Точка на ребре добавит новую')).toBeVisible();

  await page.getByRole('button', { name: 'Отменить' }).click();
  await expect(page.getByRole('textbox', { name: 'Радиус, км' })).toBeVisible();
  await page.getByRole('button', { name: 'Править по точкам' }).click();
  await page.getByRole('textbox', { name: 'Название' }).fill('Круг по точкам');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page).toHaveURL('/manager/zones');
  expect(ringOf(stub.posts[0])).toHaveLength(65);
});

test('should draw a rectangle by two corners and save its four corners', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);

  await page.getByRole('button', { name: 'Прямоугольник' }).click();
  await expect(page.getByText('Кликните в один угол, затем в противоположный')).toBeVisible();
  await clickAt(page, 0.2, 0.75);
  await clickAt(page, 0.32, 0.9);
  await expect(drawMap(page).locator('path.map-zone--draft')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Название' }).fill('Прямоугольник');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();

  await expect(page).toHaveURL('/manager/zones');
  const ring = ringOf(stub.posts[0]);
  expect(ring).toHaveLength(5);
  expect(new Set(ring.map(([lng]) => lng)).size).toBe(2);
  expect(new Set(ring.map(([, lat]) => lat)).size).toBe(2);
});
