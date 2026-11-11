import { expect, type Page, test } from '@playwright/test';
import { pushZoneChange, stubZones, updateZone, ZONES_PATH } from './support/manager-zones';

const PHONE = { width: 375, height: 812 };
const BATCH_WAIT_MS = 1_000;

function editor(page: Page) {
  return page.getByRole('dialog', { name: 'Изменить зону «Минск, центр»' });
}

test('should read the list and the untouched zone again after a change', async ({ page }) => {
  const stub = await stubZones(page);
  await page.goto(`${ZONES_PATH}/4`);
  const priority = editor(page).getByRole('textbox', { name: 'Приоритет' });
  await expect(priority).toHaveValue('10');
  const [lists, zones] = [stub.listRequests, stub.zoneRequests.length];

  updateZone(stub, 4, { priority: 30, updatedAt: '2026-10-26T09:00:00.000Z' });
  pushZoneChange(stub, 4);
  await expect(priority).toHaveValue('30');
  await expect(
    page.getByRole('table').getByRole('row').filter({ hasText: 'Минск, центр' }),
  ).toContainText('30');
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(stub.listRequests).toBe(lists + 1);
  expect(stub.zoneRequests.length).toBeGreaterThan(zones);
  await expect(editor(page).getByText('Зону изменили в другом окне')).toHaveCount(0);
});

test('should keep the draft and offer to read a zone changed in another window', async ({
  page,
}) => {
  const stub = await stubZones(page);
  await page.goto(`${ZONES_PATH}/4`);
  const priority = editor(page).getByRole('textbox', { name: 'Приоритет' });
  await priority.fill('12');

  updateZone(stub, 4, { priority: 30, updatedAt: '2026-10-26T09:00:00.000Z' });
  pushZoneChange(stub, 3);
  await page.waitForTimeout(BATCH_WAIT_MS);
  await expect(editor(page).getByText('Зону изменили в другом окне')).toHaveCount(0);

  pushZoneChange(stub, 4);
  await expect(editor(page).getByText('Зону изменили в другом окне')).toBeVisible();
  await expect(priority).toHaveValue('12');

  await editor(page).getByRole('button', { name: 'Обновить' }).click();
  await expect(priority).toHaveValue('30');
  await expect(editor(page).getByText('Зону изменили в другом окне')).toHaveCount(0);
});

test('should show the zones as cards and the editor as a sheet on a phone', async ({ page }) => {
  await page.setViewportSize(PHONE);
  const stub = await stubZones(page);
  await page.goto(ZONES_PATH);

  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Зоны');
  const cards = page.getByRole('listitem').filter({ hasText: 'Тариф:' });
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('Тариф: Пригород');
  await expect(cards.first()).toContainText('Приоритет 0, 8,15 км², изменена 20 окт');
  await expect(page.getByRole('table')).toHaveCount(0);

  await cards
    .filter({ hasText: 'Минск, центр' })
    .getByRole('link', { name: 'Изменить зону Минск, центр' })
    .click();
  const sheet = page.getByRole('dialog', { name: 'Изменить зону' });
  await expect(sheet.getByRole('textbox', { name: 'Название' })).toHaveValue('Минск, центр');
  await expect
    .poll(async () => {
      const box = await sheet.boundingBox();

      return Math.round((box?.y ?? 0) + (box?.height ?? 0));
    })
    .toBe(PHONE.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
  expect(stub.patches).toEqual([]);
});
