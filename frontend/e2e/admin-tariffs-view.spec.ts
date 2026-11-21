import { expect, test } from '@playwright/test';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../src/pages/admin/tariffs/config/texts';
import { type AdminSession, openAdminSession } from './support/admin-users';
import {
  createTariffVia,
  openTariffs,
  SEEDED_TARIFF,
  SEEDED_ZONE,
  tariffName,
  tariffRow,
  tariffSeed,
  tariffsTable,
} from './support/admin-tariffs';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should list the seeded tariff with its prices and its zone', async () => {
  const { page } = session;
  await openTariffs(page);

  await expect(page.getByText(TEXTS.SUBTITLE)).toBeVisible();
  await expect(page.getByRole('button', { name: TEXTS.NEW })).toBeEnabled();
  await expect(tariffsTable(page).getByRole('columnheader')).toHaveText([
    TEXTS.COLUMN_NAME,
    TEXTS.COLUMN_KM,
    TEXTS.COLUMN_KG,
    TEXTS.COLUMN_MIN,
    TEXTS.COLUMN_FRAGILE,
    TEXTS.COLUMN_ZONES,
    TEXTS.COLUMN_CHANGED,
    TEXTS.COLUMN_STATUS,
    TEXTS.COLUMN_ACTIONS,
  ]);

  const row = tariffRow(page, SEEDED_TARIFF);
  await expect(row.getByRole('cell').nth(0)).toHaveText(SEEDED_TARIFF);
  await expect(row.getByRole('cell').nth(1)).toHaveText('1,00');
  await expect(row.getByRole('cell').nth(2)).toHaveText('0,50');
  await expect(row.getByRole('cell').nth(3)).toHaveText('5,00');
  await expect(row.getByRole('cell').nth(4)).toHaveText('2,00');
  await expect(row.getByRole('cell').nth(5)).toHaveText(SEEDED_ZONE);
  await expect(row.getByRole('switch', { name: `Тариф ${SEEDED_TARIFF}` })).toBeChecked();
  await expect(row).toContainText(TEXTS.ON);
});

test('should show a tariff without zones, the date and who changed it', async () => {
  const { page, api } = session;
  const seed = tariffSeed(tariffName());
  await createTariffVia(api, seed);
  await openTariffs(page);

  const row = tariffRow(page, seed.name);
  await expect(row.getByRole('cell').nth(5)).toHaveText(TEXTS.NO_ZONES);
  await expect(row.getByRole('cell').nth(6)).toContainText(/\d{1,2} \S{3} \d{4}/);
  await expect(row.getByRole('cell').nth(6)).toContainText(/\S+ \S\./);
  await expect(page.getByText(/^1–\d+ из \d+$/)).toBeVisible();
});

test('should put the active tariffs first', async () => {
  const { page } = session;
  await openTariffs(page);

  const states = await tariffsTable(page).getByRole('switch').evaluateAll((switches) =>
    switches.map((item) => item.getAttribute('aria-checked')),
  );
  const firstOff = states.indexOf('false');

  if (firstOff !== -1) {
    expect(states.slice(firstOff)).not.toContain('true');
  }
});
