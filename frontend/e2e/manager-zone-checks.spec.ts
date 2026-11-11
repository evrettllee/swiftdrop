import { expect, test } from '@playwright/test';
import {
  clickAt,
  drawMap,
  drawSquare,
  drawSquareInside,
  NEW_ZONE_PATH,
  stubZoneDraw,
} from './support/manager-zone-draw';

const ZOOM_WAIT_MS = 400;

const REASONS = {
  too_few_points: 'В зоне должно быть не меньше 3 разных точек',
  too_many_points: 'В зоне может быть не больше 200 точек',
  self_intersection: 'Граница зоны пересекает или касается сама себя',
  too_small: 'Зона слишком маленькая: нужно не меньше 0,01 км²',
  out_of_range: 'Широта должна быть от -90 до 90, долгота — от -180 до 180',
} as const;

test('should not send a zone without a shape or with a too small one', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await page.getByRole('textbox', { name: 'Название' }).fill('Пустая');

  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page.getByRole('alert')).toHaveText(REASONS.too_few_points);

  for (let step = 0; step < 8; step += 1) {
    await page.getByRole('button', { name: 'Приблизить' }).click();
    await page.waitForTimeout(ZOOM_WAIT_MS);
  }

  await page.getByRole('button', { name: 'Многоугольник' }).click();
  await clickAt(page, 0.45, 0.45);
  await clickAt(page, 0.55, 0.45);
  await clickAt(page, 0.55, 0.55);
  await clickAt(page, 0.45, 0.45);
  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page.getByRole('alert')).toHaveText(REASONS.too_small);
  expect(stub.posts).toEqual([]);
});

test('should check the name and the priority with the shape', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);

  await drawSquare(page);
  await page.getByRole('textbox', { name: 'Приоритет' }).fill('200');
  await page.getByRole('button', { name: 'Сохранить зону' }).click();
  await expect(page.getByText('Название: от 1 до 80 символов')).toBeVisible();
  await expect(page.getByText('Приоритет: целое число от 0 до 100')).toBeVisible();
  expect(stub.posts).toEqual([]);
});

test('should show each refusal of the polygon by the API above the map', async ({ page }) => {
  const stub = await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await drawSquare(page);
  await page.getByRole('textbox', { name: 'Название' }).fill('Новая');

  for (const [reason, text] of Object.entries(REASONS)) {
    stub.failure = {
      status: 400,
      json: { statusCode: 400, code: 'INVALID_POLYGON', reason, message: text },
    };
    await page.getByRole('button', { name: 'Сохранить зону' }).click();
    await expect(page.getByRole('alert')).toHaveText(text);
  }

  expect(stub.posts).toHaveLength(5);
});

test('should tell which zone acts where the new one overlaps it', async ({ page }) => {
  await stubZoneDraw(page);
  await page.goto(NEW_ZONE_PATH);
  await drawSquareInside(page, drawMap(page).locator('path.map-zone--ghost').nth(2));
  const priority = page.getByRole('textbox', { name: 'Приоритет' });
  const note = page.getByRole('status').filter({ hasText: 'Пересекается с зоной «Минск»' });

  await priority.fill('5');
  await expect(note).toContainText(
    'Приоритет зоны «Минск» — 0, поэтому внутри пересечения будет действовать новая зона.',
  );
  await priority.fill('0');
  await expect(note).toContainText(
    'будет действовать зона «Минск». При равном приоритете действует более старая зона.',
  );
});
