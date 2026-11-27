import { expect, test } from '@playwright/test';
import {
  OFF_TEXTS,
  ADMIN_TARIFFS_TEXTS as TEXTS,
} from '../../src/pages/admin/tariffs/config/texts';
import { type AdminSession, openAdminSession } from '../support/admin/admin-users';
import {
  createTariffVia,
  openTariffs,
  SEEDED_TARIFF,
  SEEDED_ZONE,
  tariffName,
  tariffRow,
  tariffSeed,
} from '../support/admin/admin-tariffs';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should switch a tariff without zones off after a confirmation and on at once', async () => {
  const { page, api } = session;
  const seed = tariffSeed(tariffName());
  await createTariffVia(api, seed);
  await openTariffs(page);
  const row = tariffRow(page, seed.name);
  const toggle = row.getByRole('switch', { name: `Тариф ${seed.name}` });

  await toggle.click();
  const dialog = page.getByRole('dialog', { name: OFF_TEXTS.TITLE });
  await expect(dialog).toContainText(OFF_TEXTS.free(seed.name));
  await dialog.getByRole('button', { name: OFF_TEXTS.CANCEL }).click();
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeChecked();

  await toggle.click();
  await dialog.getByRole('button', { name: OFF_TEXTS.CONFIRM }).click();
  await expect(dialog).toBeHidden();
  await expect(toggle).not.toBeChecked();
  await expect(row).toContainText(TEXTS.OFF);

  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(row).toContainText(TEXTS.ON);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('should refuse to switch off a tariff used by an active zone and keep the switch on', async () => {
  const { page } = session;
  await openTariffs(page);
  const toggle = tariffRow(page, SEEDED_TARIFF).getByRole('switch', {
    name: `Тариф ${SEEDED_TARIFF}`,
  });

  await toggle.click();
  const dialog = page.getByRole('dialog', { name: OFF_TEXTS.TITLE });
  await expect(dialog).toContainText(`«${SEEDED_ZONE}»`);
  await dialog.getByRole('button', { name: OFF_TEXTS.CONFIRM }).click();

  await expect(dialog).toBeHidden();
  const toast = page.getByRole('status').filter({ hasText: OFF_TEXTS.REFUSED_TITLE });
  await expect(toast).toContainText(`«${SEEDED_ZONE}»`);
  await expect(toggle).toBeChecked();
  await expect(toggle).toBeEnabled();
});
