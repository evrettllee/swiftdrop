import { expect, test } from '@playwright/test';
import { ADMIN_TARIFFS_TEXTS as TEXTS, EDIT_TEXTS } from '../src/pages/admin/tariffs/config/texts';
import { type AdminSession, nameToken, openAdminSession } from './support/admin-users';
import {
  createTariffVia,
  editRow,
  openTariffs,
  SEEDED_TARIFF,
  tariffName,
  tariffRow,
  tariffSeed,
  TARIFFS_API,
} from './support/admin-tariffs';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
const seed = tariffSeed(tariffName());

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
  await createTariffVia(session.api, seed);
});

test.afterAll(async () => {
  await session.context.close();
});

async function startEdit() {
  const { page } = session;
  await openTariffs(page);
  await tariffRow(page, seed.name).getByRole('button', { name: `Изменить тариф ${seed.name}` }).click();

  return editRow(page);
}

test('should change one price, accept a comma and show who changed it', async () => {
  const row = await startEdit();
  const { page } = session;
  await expect(row.getByRole('textbox', { name: EDIT_TEXTS.NAME_LABEL })).toHaveValue(seed.name);
  await expect(row.getByRole('textbox', { name: EDIT_TEXTS.MIN_LABEL })).toHaveValue('5,00');

  await expect(page.getByRole('button', { name: TEXTS.NEW })).toBeDisabled();
  await expect(
    tariffRow(page, SEEDED_TARIFF).getByRole('button', { name: `Изменить тариф ${SEEDED_TARIFF}` }),
  ).toBeDisabled();

  await row.getByRole('textbox', { name: EDIT_TEXTS.MIN_LABEL }).fill('7,5');
  await row.getByRole('button', { name: EDIT_TEXTS.SAVE }).click();

  const saved = tariffRow(page, seed.name);
  await expect(saved.getByRole('cell').nth(3)).toHaveText('7,50');
  await expect(saved.getByRole('cell').nth(6)).toContainText(/\S+ \S\./);
  await expect(page.getByRole('button', { name: TEXTS.NEW })).toBeEnabled();
  await expect(saved.getByRole('button', { name: `Изменить тариф ${seed.name}` })).toBeFocused();
});

test('should show the mistakes under their fields and keep the row open', async () => {
  const row = await startEdit();
  const field = (label: string) => row.getByRole('textbox', { name: label });

  await field(EDIT_TEXTS.NAME_LABEL).fill('а');
  await field(EDIT_TEXTS.KM_LABEL).fill('0');
  await field(EDIT_TEXTS.KG_LABEL).fill('0,123');
  await field(EDIT_TEXTS.MIN_LABEL).fill('1001');
  await field(EDIT_TEXTS.FRAGILE_LABEL).fill('');
  await row.getByRole('button', { name: EDIT_TEXTS.SAVE }).click();

  await expect(row.getByText('Название от 2 до 50 символов')).toBeVisible();
  await expect(row.getByText('Больше 0')).toBeVisible();
  await expect(row.getByText('Не больше двух знаков после запятой')).toBeVisible();
  await expect(row.getByText('Не больше 1000')).toBeVisible();
  await expect(row.getByText('Введите число')).toBeVisible();
  await expect(field(EDIT_TEXTS.NAME_LABEL)).toBeFocused();

  await field(EDIT_TEXTS.NAME_LABEL).fill(seed.name);
  await expect(row.getByText('Название от 2 до 50 символов')).toBeHidden();
});

test('should cancel with Escape and bring the values back', async () => {
  const row = await startEdit();
  const { page } = session;

  await row.getByRole('textbox', { name: EDIT_TEXTS.KM_LABEL }).fill('9');
  await page.keyboard.press('Escape');

  await expect(editRow(page)).toHaveCount(0);
  const back = tariffRow(page, seed.name);
  await expect(back.getByRole('cell').nth(1)).toHaveText('0,85');
  await expect(back.getByRole('button', { name: `Изменить тариф ${seed.name}` })).toBeFocused();
});

test('should close the row without a request when nothing changed', async () => {
  const row = await startEdit();
  const { page } = session;
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().includes(TARIFFS_API)) {
      writes.push(request.url());
    }
  });

  await row.getByRole('button', { name: EDIT_TEXTS.SAVE }).click();

  await expect(editRow(page)).toHaveCount(0);
  expect(writes).toEqual([]);
});

test('should save with Enter in a field and refuse a taken name under the name', async () => {
  const taken = tariffSeed(tariffName());
  await createTariffVia(session.api, taken);
  const row = await startEdit();
  const { page } = session;
  const name = row.getByRole('textbox', { name: EDIT_TEXTS.NAME_LABEL });

  await name.fill(taken.name.toLowerCase());
  await name.press('Enter');
  await expect(row.getByText('Тариф с таким названием уже есть')).toBeVisible();
  await expect(editRow(page)).toHaveCount(1);

  const renamed = `Тест ${nameToken()}`;
  await name.fill(renamed);
  await name.press('Enter');

  await expect(editRow(page)).toHaveCount(0);
  await expect(tariffRow(page, renamed)).toBeVisible();
  seed.name = renamed;
});
