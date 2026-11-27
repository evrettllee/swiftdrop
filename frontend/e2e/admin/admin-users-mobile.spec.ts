import { expect, test } from '@playwright/test';
import { ADMIN_USERS_TEXTS as TEXTS } from '../../src/pages/admin/users/config/texts';
import { INVITE_STAFF_TEXTS as INVITE } from '../../src/pages/admin/users/config/invite-texts';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';
import {
  type AdminSession,
  inviteVia,
  openAdminSession,
  PHONE_VIEWPORT,
  staffSeed,
  type StaffSeed,
} from '../support/admin/admin-users';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
let seed: StaffSeed;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser, PHONE_VIEWPORT);
  seed = staffSeed('courier', 'Телефонный', `phone-${Date.now()}@swiftdrop.test`);
  await inviteVia(session.api, seed);
});

test.afterAll(async () => {
  await session.context.close();
});

async function expectNoOverflow(): Promise<void> {
  const overflow = await session.page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('should show the couriers as cards with the pages under them', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier&q=${encodeURIComponent(seed.email)}`);
  const list = page.getByRole('list', { name: TEXTS.TABLE_LABEL });

  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText(seed.email);
  await expect(list).toContainText('Приглашён');
  await expect(list).toContainText('доставлено 0');
  await expect(page.getByText('Страница 1 из 1')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByLabel(TEXTS.SORT)).toHaveText(/Новые/);
  await expectNoOverflow();
});

test('should open the filters in a sheet', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);

  await page.getByRole('button', { name: /Фильтры/ }).click();

  const sheet = page.getByRole('dialog', { name: TEXTS.FILTERS });
  await expect(sheet.getByRole('checkbox', { name: 'Удалённые' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Пеший', exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Пеший', exact: true }).click();
  await sheet.getByRole('button', { name: /^Показать/ }).click();

  await expect(page).toHaveURL(/vehicle=foot/);
  await expect(sheet).toBeHidden();
  await expectNoOverflow();
});

const LONG_SEARCH_QUERY = 'very-long-courier-search-query-phone-8888888888888@swiftdrop.test';

test('should open the invite in a sheet with the main button on top', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);

  await page.getByRole('button', { name: TEXTS.ADD_STAFF_SHORT }).click();

  const sheet = page.getByRole('dialog', { name: INVITE.TITLE });
  await expect(sheet.getByText(INVITE.COURIER_HINT_SHORT)).toBeVisible();
  const submit = await sheet.getByRole('button', { name: INVITE.SUBMIT }).boundingBox();
  const cancel = await sheet.getByRole('button', { name: INVITE.CANCEL }).boundingBox();
  expect(submit?.y ?? 0).toBeLessThan(cancel?.y ?? 0);
  await expectNoOverflow();
});

test('should fit a long filter chip inside 375px with full accessible label and clear it', async () => {
  const { page } = session;
  await page.goto(
    `${APP_ROUTES.ADMIN_USERS}?role=courier&q=${encodeURIComponent(LONG_SEARCH_QUERY)}`,
  );
  const chip = page.getByRole('button', {
    name: TEXTS.removeFilter(TEXTS.SEARCH_CHIP, LONG_SEARCH_QUERY),
  });

  await expect(chip).toBeVisible();
  await expectNoOverflow();

  const box = await chip.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeLessThanOrEqual(PHONE_VIEWPORT.width);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(PHONE_VIEWPORT.width);

  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(page).not.toHaveURL(/q=/);
});
