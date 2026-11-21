import { expect, type Locator, test } from '@playwright/test';
import { ADMIN_TARIFFS_TEXTS as TEXTS, EDIT_TEXTS } from '../src/pages/admin/tariffs/config/texts';
import { type AdminSession, openAdminSession, PHONE_VIEWPORT } from './support/admin-users';
import { createTariffVia, tariffName, tariffSeed } from './support/admin-tariffs';
import { expectNoOverflow } from './support/set-password';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
const seed = tariffSeed(tariffName());

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser, PHONE_VIEWPORT);
  await createTariffVia(session.api, seed);
});

test.afterAll(async () => {
  await session.context.close();
});

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  expect(found).not.toBeNull();

  return found ?? { x: 0, y: 0, width: 0, height: 0 };
}

function cardOf(name: string) {
  return session.page.getByRole('article').filter({ hasText: name });
}

test('should show a card per tariff with the values in two columns', async () => {
  const { page } = session;
  await page.goto('/admin/tariffs');
  const card = cardOf(seed.name);

  await expect(card).toBeVisible();
  await expect(card).toContainText('0,85 BYN');
  await expect(card).toContainText('5,00 BYN');
  await expect(card).toContainText('Зоны: нет');
  await expect(card).toContainText(/Изменён \d{1,2} \S{3} · \S+ \S\./);
  await expect(card.getByRole('switch')).toBeChecked();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expectNoOverflow(page);

  const km = await box(card.getByText(TEXTS.LABEL_KM, { exact: true }));
  const kg = await box(card.getByText(TEXTS.LABEL_KG, { exact: true }));
  const min = await box(card.getByText(TEXTS.LABEL_MIN, { exact: true }));
  expect(kg.x).toBeGreaterThan(km.x + 50);
  expect(Math.abs(kg.y - km.y)).toBeLessThan(2);
  expect(min.y).toBeGreaterThan(km.y + 20);
});

test('should edit in a sheet with the main button on top and the fields in two columns', async () => {
  const { page } = session;
  await page.goto('/admin/tariffs');
  await cardOf(seed.name).getByRole('button', { name: `Изменить тариф ${seed.name}` }).click();

  const sheet = page.getByRole('dialog', { name: EDIT_TEXTS.EDIT_TITLE });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(EDIT_TEXTS.HINT)).toBeVisible();
  const save = await box(sheet.getByRole('button', { name: EDIT_TEXTS.SAVE }));
  const cancel = await box(sheet.getByRole('button', { name: EDIT_TEXTS.CANCEL }));
  expect(save.y).toBeLessThan(cancel.y);

  const km = await box(sheet.getByLabel(EDIT_TEXTS.PHONE_KM));
  const kg = await box(sheet.getByLabel(EDIT_TEXTS.PHONE_KG));
  expect(kg.x).toBeGreaterThan(km.x + km.width - 1);
  expect(Math.abs(kg.y - km.y)).toBeLessThan(2);

  await sheet.getByLabel(EDIT_TEXTS.PHONE_MIN).fill('0');
  await sheet.getByRole('button', { name: EDIT_TEXTS.SAVE }).click();
  await expect(sheet.getByText('Больше 0', { exact: true })).toBeVisible();

  await sheet.getByLabel(EDIT_TEXTS.PHONE_MIN).fill('6,5');
  await sheet.getByRole('button', { name: EDIT_TEXTS.SAVE }).click();
  await expect(sheet).toBeHidden();
  await expect(cardOf(seed.name)).toContainText('6,50 BYN');
  await expectNoOverflow(page);
});

test('should create a tariff from the sheet', async () => {
  const { page } = session;
  const name = tariffName();
  await page.goto('/admin/tariffs');
  await page.getByRole('button', { name: TEXTS.NEW }).click();

  const sheet = page.getByRole('dialog', { name: EDIT_TEXTS.NEW_TITLE });
  await sheet.getByLabel(EDIT_TEXTS.PHONE_NAME).fill(name);
  await sheet.getByLabel(EDIT_TEXTS.PHONE_KM).fill('1');
  await sheet.getByLabel(EDIT_TEXTS.PHONE_KG).fill('0,5');
  await sheet.getByLabel(EDIT_TEXTS.PHONE_MIN).fill('5');
  await sheet.getByLabel(EDIT_TEXTS.PHONE_FRAGILE).fill('2');
  await sheet.getByRole('button', { name: EDIT_TEXTS.CREATE }).click();

  await expect(sheet).toBeHidden();
  await expect(cardOf(name)).toBeVisible();
  await expect(cardOf(name).getByRole('switch')).toBeChecked();
});
