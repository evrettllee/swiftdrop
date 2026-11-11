import { expect, type Page, test } from '@playwright/test';
import {
  drawMap,
  NEW_ZONE_PATH,
  ringOf,
  stubZoneDraw,
  vertexOnScreen,
} from './support/manager-zone-draw';

const NEIGHBOR_VERTEX = [27.72, 53.97];
const OFFSETS = [
  [5, 4],
  [-70, 4],
  [-70, 60],
  [-8, 60],
];

async function drawNearNeighbor(page: Page): Promise<void> {
  const target = await vertexOnScreen(drawMap(page).locator('path.map-zone--ghost').first(), 0);
  await page.getByRole('button', { name: 'Многоугольник' }).click();

  for (const [dx, dy] of OFFSETS) {
    await page.mouse.move(target.x + dx, target.y + dy, { steps: 5 });
    await page.mouse.click(target.x + dx, target.y + dy);
  }

  const [firstX, firstY] = OFFSETS[0];
  await page.mouse.move(target.x + firstX, target.y + firstY, { steps: 5 });
  await page.mouse.click(target.x + firstX, target.y + firstY);
}

async function saveRing(page: Page, stub: Awaited<ReturnType<typeof stubZoneDraw>>) {
  await page.getByRole('textbox', { name: 'Название' }).fill('Рядом с Боровлянами');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page).toHaveURL('/manager/zones');

  return ringOf(stub.posts[0]);
}

test('should give a vertex near a vertex of the neighbour its exact coordinates', async ({
  page,
}) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await expect(drawMap(page).locator('path.map-zone--ghost')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Прилипание к соседним зонам' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await drawNearNeighbor(page);
  await expect(drawMap(page).locator('.zone-draw__snapped').first()).toBeVisible();
  const ring = await saveRing(page, stub);

  expect(ring[0]).toEqual(NEIGHBOR_VERTEX);
  expect(ring).toHaveLength(5);
});

test('should keep the clicked point when the snapping is off', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await expect(drawMap(page).locator('path.map-zone--ghost')).toHaveCount(4);

  const snap = page.getByRole('button', { name: 'Прилипание к соседним зонам' });
  await snap.click();
  await expect(snap).toHaveAttribute('aria-pressed', 'false');
  await drawNearNeighbor(page);
  await expect(drawMap(page).locator('.zone-draw__snapped')).toHaveCount(0);
  const ring = await saveRing(page, stub);

  expect(ring[0]).not.toEqual(NEIGHBOR_VERTEX);
});
