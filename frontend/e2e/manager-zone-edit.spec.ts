import { expect, type Page, test } from '@playwright/test';
import { stubZones, updateZone, zoneConflict, ZONES_PATH } from './support/manager-zones';

const CENTER_PATH = `${ZONES_PATH}/4`;
const CENTER_UPDATED_AT = '2026-10-12T09:00:00.000Z';

function editor(page: Page) {
  return page.getByRole('dialog', { name: 'Изменить зону «Минск, центр»' });
}

async function openCenter(page: Page) {
  const stub = await stubZones(page);
  await page.goto(ZONES_PATH);
  await page.getByRole('link', { name: 'Изменить зону Минск, центр' }).click();
  await expect(page).toHaveURL(CENTER_PATH);
  await expect(editor(page).getByRole('textbox', { name: 'Название' })).toHaveValue('Минск, центр');

  return { stub, dialog: editor(page) };
}

test('should send only the changed fields with the time of the loaded zone', async ({ page }) => {
  const { stub, dialog } = await openCenter(page);

  await expect(dialog.getByRole('combobox', { name: 'Тариф' })).toHaveValue('1');
  await expect(dialog.getByRole('textbox', { name: 'Приоритет' })).toHaveValue('10');
  await expect(dialog.getByRole('switch', { name: 'Зона включена' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(
    dialog.getByText('Где зоны пересекаются, действует зона с большим приоритетом.'),
  ).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Сохранить' })).toBeEnabled();

  await dialog.getByRole('textbox', { name: 'Название' }).fill(' Центр ');
  await dialog.getByRole('combobox', { name: 'Тариф' }).selectOption('2');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();

  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(ZONES_PATH);
  expect(stub.patches).toEqual([
    { zoneId: 4, body: { name: 'Центр', tariffId: 2, expectedUpdatedAt: CENTER_UPDATED_AT } },
  ]);
  await expect(page.getByRole('status').filter({ hasText: 'Зона сохранена' })).toBeVisible();
});

test('should check the fields before sending', async ({ page }) => {
  const { stub, dialog } = await openCenter(page);

  await dialog.getByRole('textbox', { name: 'Название' }).fill('  ');
  await dialog.getByRole('textbox', { name: 'Приоритет' }).fill('101');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();

  await expect(dialog.getByText('Название: от 1 до 80 символов')).toBeVisible();
  await expect(dialog.getByText('Приоритет: целое число от 0 до 100')).toBeVisible();
  expect(stub.patches).toEqual([]);
});

test('should offer to read a zone changed by someone else and drop the draft', async ({ page }) => {
  const { stub, dialog } = await openCenter(page);
  stub.failure = zoneConflict('ZONE_CHANGED');
  updateZone(stub, 4, { priority: 15, updatedAt: '2026-10-25T09:00:00.000Z' });

  await dialog.getByRole('textbox', { name: 'Приоритет' }).fill('20');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(
    dialog.getByText('Зону уже изменили. Обновите, чтобы увидеть новые данные'),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  stub.failure = null;
  await dialog.getByRole('button', { name: 'Обновить' }).click();
  await expect(dialog.getByRole('textbox', { name: 'Приоритет' })).toHaveValue('15');
  await dialog.getByRole('textbox', { name: 'Приоритет' }).fill('16');
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(dialog).toBeHidden();
  expect(stub.patches.at(-1)?.body).toEqual({
    priority: 16,
    expectedUpdatedAt: '2026-10-25T09:00:00.000Z',
  });
});

test('should show each refusal of the API at its field', async ({ page }) => {
  const { stub, dialog } = await openCenter(page);
  const save = dialog.getByRole('button', { name: 'Сохранить' });

  stub.failure = zoneConflict('ZONE_NAME_TAKEN');
  await dialog.getByRole('textbox', { name: 'Название' }).fill('Минск');
  await save.click();
  await expect(dialog.getByRole('textbox', { name: 'Название' })).toHaveAccessibleDescription(
    'Зона с таким названием уже есть',
  );

  stub.failure = zoneConflict('TARIFF_NOT_FOUND', 422);
  await save.click();
  await expect(dialog.getByRole('combobox', { name: 'Тариф' })).toHaveAccessibleDescription(
    'Тариф не найден',
  );

  stub.failure = zoneConflict('LAST_ACTIVE_ZONE');
  await dialog.getByRole('switch', { name: 'Зона включена' }).click();
  await save.click();
  await expect(
    dialog.getByText('Нельзя выключить последнюю активную зону: без неё нельзя оформить заказ'),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
});

test('should ask before closing with changes and close at once without them', async ({ page }) => {
  const { dialog } = await openCenter(page);
  const discard = page.getByRole('dialog', { name: 'Отменить изменения?' });

  await dialog.getByRole('textbox', { name: 'Приоритет' }).fill('11');
  await page.keyboard.press('Escape');
  await expect(discard).toBeVisible();
  await discard.getByRole('button', { name: 'Продолжить правку' }).click();
  await expect(discard).toBeHidden();
  await expect(dialog.getByRole('textbox', { name: 'Приоритет' })).toHaveValue('11');

  await dialog.getByRole('button', { name: 'Отмена' }).click();
  await discard.getByRole('button', { name: 'Отменить изменения' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(ZONES_PATH);

  await page.getByRole('link', { name: 'Изменить зону Минск, центр' }).click();
  await expect(editor(page).getByRole('textbox', { name: 'Приоритет' })).toHaveValue('10');
  await editor(page).getByRole('button', { name: 'Закрыть' }).click();
  await expect(editor(page)).toBeHidden();
  await expect(discard).toBeHidden();
});

test('should lead to the page of the border', async ({ page }) => {
  const { dialog } = await openCenter(page);

  await dialog.getByRole('button', { name: 'Изменить границу на карте' }).click();
  await expect(page).toHaveURL(`${CENTER_PATH}/contour`);
  await expect(page.getByRole('heading', { name: 'Граница зоны' })).toBeVisible();
});
