import { expect, test } from '@playwright/test';
import {
  ADMIN_TARIFFS_TEXTS as TEXTS,
  EDIT_TEXTS,
} from '../../src/pages/admin/tariffs/config/texts';
import { type AdminSession, openAdminSession } from '../support/admin/admin-users';
import {
  createTariffVia,
  editRow,
  openTariffs,
  SEEDED_TARIFF,
  tariffName,
  tariffRow,
  tariffSeed,
  tariffsTable,
} from '../support/admin/admin-tariffs';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should refuse a duplicate name, then create the tariff on top, switched on', async () => {
  const { page, api } = session;
  const existing = tariffSeed(tariffName());
  await createTariffVia(api, existing);
  await openTariffs(page);

  await page.getByRole('button', { name: TEXTS.NEW }).click();
  const row = editRow(page);
  await expect(page.getByRole('button', { name: TEXTS.NEW })).toBeDisabled();
  await expect(row.getByRole('textbox', { name: EDIT_TEXTS.NAME_LABEL })).toBeFocused();
  await expect(row).toContainText(TEXTS.CHANGED_NEW);
  await expect(row).toContainText(TEXTS.NO_ZONES);
  await expect(row.getByRole('switch')).toBeChecked();

  await row.getByRole('button', { name: EDIT_TEXTS.CREATE }).click();
  await expect(row.getByText('Название от 2 до 50 символов')).toBeVisible();

  await row.getByRole('textbox', { name: EDIT_TEXTS.NAME_LABEL }).fill(existing.name);
  await row.getByRole('textbox', { name: EDIT_TEXTS.KM_LABEL }).fill('1,2');
  await row.getByRole('textbox', { name: EDIT_TEXTS.KG_LABEL }).fill('0.4');
  await row.getByRole('textbox', { name: EDIT_TEXTS.MIN_LABEL }).fill('6');
  await row.getByRole('textbox', { name: EDIT_TEXTS.FRAGILE_LABEL }).fill('2,5');
  await row.getByRole('button', { name: EDIT_TEXTS.CREATE }).click();
  await expect(row.getByText('Тариф с таким названием уже есть')).toBeVisible();

  const name = tariffName();
  await row.getByRole('textbox', { name: EDIT_TEXTS.NAME_LABEL }).fill(name);
  await row.getByRole('button', { name: EDIT_TEXTS.CREATE }).click();

  await expect(editRow(page)).toHaveCount(0);
  const created = tariffRow(page, name);
  await expect(created.getByRole('cell').nth(1)).toHaveText('1,20');
  await expect(created.getByRole('cell').nth(2)).toHaveText('0,40');
  await expect(created.getByRole('cell').nth(3)).toHaveText('6,00');
  await expect(created.getByRole('cell').nth(4)).toHaveText('2,50');
  await expect(created.getByRole('switch')).toBeChecked();
  await expect(tariffsTable(page).getByRole('row').nth(1)).toContainText(name);
  await expect(page.getByRole('button', { name: TEXTS.NEW })).toBeEnabled();
});

test('should drop a new row on Cancel and leave the list as it was', async () => {
  const { page } = session;
  await openTariffs(page);
  const before = await tariffsTable(page).getByRole('row').count();

  await page.getByRole('button', { name: TEXTS.NEW }).click();
  await expect(editRow(page)).toBeVisible();
  await editRow(page).getByRole('button', { name: EDIT_TEXTS.CANCEL }).click();

  await expect(editRow(page)).toHaveCount(0);
  await expect(tariffsTable(page).getByRole('row')).toHaveCount(before);
  await expect(tariffRow(page, SEEDED_TARIFF)).toBeVisible();
});
